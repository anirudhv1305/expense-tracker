import { authService } from './auth';
import { localDateString, requireSupabase } from './supabase';
import { makeXlsx } from './xlsxExport';

const db = () => requireSupabase();
const numeric = (value) => Number(value || 0);
const result = async (query) => {
  const { data, error } = await query;
  if (error) throw error;
  return data;
};
const exactCount = async (query) => {
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
};

function monthSummary(month) {
  return {
    ...month,
    savings: numeric(month.total_credits) - numeric(month.total_debits),
    openingBalance: numeric(month.opening_balance),
    totalCredits: numeric(month.total_credits),
    totalDebits: numeric(month.total_debits),
    closingBalance: numeric(month.closing_balance),
    transactionCount: month.transaction_count,
    startDate: month.start_date,
    endDate: month.end_date
  };
}

function transactionView(tx) {
  return {
    id: tx.id,
    type: tx.type,
    category: tx.category_name,
    subCategory: tx.subcategory_name,
    creditSubCategory: tx.credit_subcategory_name,
    creditSource: tx.credit_source_name,
    amount: numeric(tx.amount),
    occurredAt: tx.occurred_at.replace(' ', 'T'),
    description: tx.description,
    balanceAfterTransaction: numeric(tx.balance_after_transaction)
  };
}

function percentage(value, total) { return total === 0 ? 0 : Number((value * 100 / total).toFixed(2)); }
function delta(current, previous) { return previous === 0 ? 0 : Number(((current - previous) * 100 / previous).toFixed(2)); }
function daysBetween(start, end) {
  const days = [];
  const current = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (current <= last) {
    days.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return days;
}

async function getCategories() {
  return result(db().from('categories').select('*').order('display_order').order('created_at'));
}
async function getCreditSources() {
  return result(db().from('credit_sources').select('id,name,active').order('display_order').order('created_at'));
}
async function getCreditSubcategories() {
  return result(db().from('credit_subcategories').select('id,credit_source_id,name,active').order('created_at'));
}
async function findMonth(monthId) {
  return result(db().from('monthly_records').select('*').eq('id', monthId).single());
}

async function monthReport(month) {
  const [rows, categories, sources, noteRow, previousRows] = await Promise.all([
    result(db().from('transactions').select('*').eq('monthly_record_id', month.id).order('occurred_at').order('created_at')),
    getCategories(), getCreditSources(),
    result(db().from('monthly_notes').select('content').eq('monthly_record_id', month.id).maybeSingle()),
    result(db().from('monthly_records').select('*').eq('year', month.month === 1 ? month.year - 1 : month.year).eq('month', month.month === 1 ? 12 : month.month - 1).maybeSingle())
  ]);
  const transactions = rows.map(transactionView);
  const debitRows = rows.filter((tx) => tx.type === 'DEBIT');
  const creditRows = rows.filter((tx) => tx.type === 'CREDIT');
  const debitTotal = debitRows.reduce((sum, tx) => sum + numeric(tx.amount), 0);
  const creditTotal = creditRows.reduce((sum, tx) => sum + numeric(tx.amount), 0);
  const categoryTotals = categories.map((category) => {
    const total = debitRows.filter((tx) => tx.category_id === category.id).reduce((sum, tx) => sum + numeric(tx.amount), 0);
    return { id: category.id, name: category.name, total, percentage: percentage(total, debitTotal) };
  });
  const sourceTotals = sources.map((source) => ({
    id: source.id, name: source.name,
    total: creditRows.filter((tx) => tx.credit_source_id === source.id).reduce((sum, tx) => sum + numeric(tx.amount), 0)
  }));
  const dailyMap = new Map();
  debitRows.forEach((tx) => {
    const date = tx.occurred_at.slice(0, 10);
    dailyMap.set(date, (dailyMap.get(date) || 0) + numeric(tx.amount));
  });
  const dailySpending = daysBetween(month.start_date, month.end_date).map((date) => ({ date, amount: dailyMap.get(date) || 0 }));
  const largest = debitRows.reduce((max, tx) => !max || numeric(tx.amount) > numeric(max.amount) ? tx : max, null);
  const used = new Map();
  debitRows.forEach((tx) => used.set(tx.category_name, (used.get(tx.category_name) || 0) + 1));
  const mostUsedCategory = [...used.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'No expenses yet';
  const highestSpendingDay = [...dailySpending].sort((a, b) => b.amount - a.amount)[0]?.date || month.start_date;
  const subMap = new Map();
  debitRows.filter((tx) => tx.subcategory_name).forEach((tx) => {
    const key = `${tx.category_name}\u0000${tx.subcategory_name}`;
    const group = subMap.get(key) || { name: tx.subcategory_name, category: tx.category_name, total: 0, transactions: [] };
    group.total += numeric(tx.amount); group.transactions.push(transactionView(tx)); subMap.set(key, group);
  });
  const previous = previousRows ? await monthReportTotals(previousRows) : null;
  const prevByCategory = new Map((previous?.categoryTotals || []).map((item) => [item.id, item.total]));
  const monthDays = new Date(Date.UTC(month.year, month.month, 0)).getUTCDate();
  return {
    month: monthSummary(month), categoryTotals, sourceTotals, dailySpending, transactions,
    insights: {
      largestExpense: largest ? transactionView(largest) : null,
      mostUsedCategory,
      highestSpendingDay,
      averageDailySpending: Number((debitTotal / monthDays).toFixed(2)),
      averageTransactionValue: rows.length ? Number(((debitTotal + creditTotal) / rows.length).toFixed(2)) : 0
    },
    notes: noteRow?.content || '',
    comparison: previous ? {
      label: `${previous.month} ${previous.year}`,
      incomePct: delta(creditTotal, previous.credits),
      expensesPct: delta(debitTotal, previous.debits),
      savingsPct: delta(creditTotal - debitTotal, previous.credits - previous.debits),
      categoryChanges: categoryTotals.map((item) => ({ id: item.id, name: item.name, percentage: delta(item.total, prevByCategory.get(item.id) || 0) }))
    } : { label: 'No previous month', incomePct: 0, expensesPct: 0, savingsPct: 0, categoryChanges: [] },
    subCategoryTotals: [...subMap.values()].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
  };
}

async function monthReportTotals(month) {
  const [rows, categories] = await Promise.all([
    result(db().from('transactions').select('*').eq('monthly_record_id', month.id)), getCategories()
  ]);
  const categoryTotals = categories.map((category) => ({ id: category.id, total: rows.filter((tx) => tx.type === 'DEBIT' && tx.category_id === category.id).reduce((sum, tx) => sum + numeric(tx.amount), 0) }));
  return { year: month.year, month: month.month,
    credits: rows.filter((tx) => tx.type === 'CREDIT').reduce((sum, tx) => sum + numeric(tx.amount), 0),
    debits: rows.filter((tx) => tx.type === 'DEBIT').reduce((sum, tx) => sum + numeric(tx.amount), 0), categoryTotals };
}

async function selectedMonth() {
  const row = await result(db().rpc('ensure_current_month', { p_today: localDateString() }));
  return Array.isArray(row) ? row[0] : row;
}

function toTransactionArgs(payload, transactionId = null) {
  return {
    p_type: payload.type,
    p_amount: Number(payload.amount),
    p_date: payload.date,
    p_description: payload.description,
    p_category_id: payload.type === 'DEBIT' ? payload.categoryId || null : null,
    p_credit_source_id: payload.type === 'CREDIT' ? payload.creditSourceId || null : null,
    p_subcategory_id: payload.type === 'DEBIT' ? payload.subCategoryId || null : null,
    p_credit_subcategory_id: payload.type === 'CREDIT' ? payload.creditSubCategoryId || null : null,
    p_transaction_id: transactionId,
    p_today: localDateString()
  };
}

function csvCell(value, formulaSafe = false) {
  let text = String(value ?? '');
  if (formulaSafe && /^[\t\r ]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
async function exportRows(monthId) {
  const month = await findMonth(monthId);
  const rows = await result(db().from('transactions').select('*').eq('monthly_record_id', monthId).order('occurred_at').order('created_at'));
  const headers = ['User', 'Date', 'Amount', 'Category', 'Sub Category', 'Description', 'Balance After Transaction'];
  const user = (await authService.getSession())?.user;
  const values = rows.map((tx) => [user?.email || '', tx.occurred_at.slice(0, 10), tx.amount, tx.category_name || tx.credit_source_name || '', tx.subcategory_name || tx.credit_subcategory_name || '', tx.description, tx.balance_after_transaction]);
  return { month, headers, values };
}

export const client = {
  login: (payload) => authService.signIn(payload),
  register: (payload) => authService.signUp(payload),
  logout: () => authService.signOut(),
  setupStatus: async () => {
    const data = await result(db().from('settings').select('setup_complete').single());
    return { setupComplete: data.setup_complete };
  },
  setup: async (initialBalance) => {
    const data = await result(db().rpc('setup_tracking', { p_initial_balance: initialBalance, p_today: localDateString() }));
    return monthSummary(Array.isArray(data) ? data[0] : data);
  },
  dashboard: async () => {
    const month = await selectedMonth();
    const report = await monthReport(month);
    return { month: report.month, currentBankBalance: report.month.closingBalance, categoryTotals: report.categoryTotals,
      sourceTotals: report.sourceTotals, dailySpending: report.dailySpending,
      recentTransactions: [...report.transactions].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 8) };
  },
  history: async () => (await result(db().from('monthly_records').select('*').order('year', { ascending: false }).order('month', { ascending: false }))).map(monthSummary),
  month: async (monthId) => monthReport(await findMonth(monthId)),
  saveNote: (monthId, content) => result(db().rpc('save_month_note', { p_month_id: monthId, p_content: content })),
  categories: async () => (await getCategories()).filter((item) => item.active).map(({ id, name }) => ({ id, name })),
  categoryTree: async () => {
    const [categories, subcategories] = await Promise.all([getCategories(), result(db().from('subcategories').select('*').order('created_at'))]);
    return categories.map((category) => ({ id: category.id, name: category.name, active: category.active,
      subCategories: subcategories.filter((sub) => sub.category_id === category.id).map((sub) => ({ id: sub.id, name: sub.name, active: sub.active })) }));
  },
  createCategory: async (name) => result(db().from('categories').insert({ name: name.trim() }).select().single()),
  updateCategory: async (id, name) => result(db().from('categories').update({ name: name.trim() }).eq('id', id).select().single()),
  archiveCategory: async (id) => {
    const count = await exactCount(db().from('transactions').select('id', { count: 'exact', head: true }).eq('category_id', id));
    if (count) {
      await result(db().from('categories').update({ active: false }).eq('id', id));
      await result(db().from('subcategories').update({ active: false }).eq('category_id', id));
    } else await result(db().from('categories').delete().eq('id', id));
  },
  createSubCategory: (id, name) => result(db().from('subcategories').insert({ category_id: id, name: name.trim() }).select().single()),
  updateSubCategory: (id, name) => result(db().from('subcategories').update({ name: name.trim() }).eq('id', id).select().single()),
  archiveSubCategory: async (id) => {
    const count = await exactCount(db().from('transactions').select('id', { count: 'exact', head: true }).eq('subcategory_id', id));
    if (count) await result(db().from('subcategories').update({ active: false }).eq('id', id));
    else await result(db().from('subcategories').delete().eq('id', id));
  },
  creditSourceList: async () => {
    const [sources, subcategories] = await Promise.all([getCreditSources(), getCreditSubcategories()]);
    return sources.map((source) => ({ ...source, subCategories: subcategories.filter((item) => item.credit_source_id === source.id) }));
  },
  createCreditSource: async (name) => result(db().from('credit_sources').insert({ name: name.trim() }).select().single()),
  updateCreditSource: async (id, name) => result(db().from('credit_sources').update({ name: name.trim() }).eq('id', id).select().single()),
  archiveCreditSource: async (id) => {
    const count = await exactCount(db().from('transactions').select('id', { count: 'exact', head: true }).eq('credit_source_id', id));
    if (count) await result(db().from('credit_sources').update({ active: false }).eq('id', id));
    else await result(db().from('credit_sources').delete().eq('id', id));
  },
  createCreditSubCategory: (id, name) => result(db().from('credit_subcategories').insert({ credit_source_id: id, name: name.trim() }).select().single()),
  updateCreditSubCategory: (id, name) => result(db().from('credit_subcategories').update({ name: name.trim() }).eq('id', id).select().single()),
  archiveCreditSubCategory: async (id) => {
    const count = await exactCount(db().from('transactions').select('id', { count: 'exact', head: true }).eq('credit_subcategory_id', id));
    if (count) await result(db().from('credit_subcategories').update({ active: false }).eq('id', id));
    else await result(db().from('credit_subcategories').delete().eq('id', id));
  },
  updateOpeningBalance: async (openingBalance) => {
    const month = await result(db().rpc('update_opening_balance', { p_opening_balance: openingBalance, p_today: localDateString() }));
    return monthSummary(Array.isArray(month) ? month[0] : month);
  },
  creditSources: async () => (await client.creditSourceList()).filter((source) => source.active).map((source) => ({
    id: source.id,
    name: source.name,
    subCategories: source.subCategories.filter((sub) => sub.active)
  })),
  createTransaction: async (payload) => result(db().rpc('save_transaction', toTransactionArgs(payload))),
  updateTransaction: async (id, payload) => result(db().rpc('save_transaction', toTransactionArgs(payload, id))),
  deleteTransaction: (id) => result(db().rpc('delete_transaction', { p_transaction_id: id })),
  downloadCsv: async (monthId) => {
    const { headers, values } = await exportRows(monthId);
    const csv = [headers.map((cell) => csvCell(cell)), ...values.map((row) => row.map((cell, index) => csvCell(cell, [0, 1, 3, 4, 5].includes(index))))]
      .map((row) => row.join(',')).join('\r\n');
    return { data: new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }) };
  },
  downloadExcel: async (monthId) => {
    const { headers, values } = await exportRows(monthId);
    const bytes = makeXlsx(headers, values);
    return { data: new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }) };
  }
};
