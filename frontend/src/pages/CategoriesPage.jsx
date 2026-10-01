import { useEffect, useState } from 'react';
import { Archive, ChevronDown, ChevronRight, CircleDollarSign, Pencil, Plus, Tag } from 'lucide-react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { client } from '../services/api';
import { useApp } from '../state/AppContext';

export default function CategoriesPage() {
  const { refreshCategories } = useApp();
  const [categories, setCategories] = useState([]);
  const [creditSources, setCreditSources] = useState([]);
  const [history, setHistory] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [name, setName] = useState('');
  const [creditSourceName, setCreditSourceName] = useState('');
  const [subNames, setSubNames] = useState({});
  const [creditSubNames, setCreditSubNames] = useState({});
  const [error, setError] = useState('');
  async function load() { const [data, sources, months] = await Promise.all([client.categoryTree(), client.creditSourceList(), client.history()]); setCategories(data); setCreditSources(sources); setHistory(months); }
  useEffect(() => { load().catch(() => setError('Could not load categories.')); }, []);
  async function run(action) { setError(''); try { await action(); await load(); await refreshCategories(); } catch (e) { setError(e.message || 'Could not save changes. Check your connection and try again.'); } }
  async function addCategory(e) { e.preventDefault(); if (!name.trim()) return; await run(async () => { await client.createCategory(name.trim()); setName(''); }); }
  function renameCategory(item) { const value = window.prompt('Rename category', item.name); if (value?.trim()) run(() => client.updateCategory(item.id, value.trim())); }
  function archiveCategory(item) { if (window.confirm(`Archive “${item.name}”? It will be unavailable for new transactions. Existing transactions remain in your history.`)) run(() => client.archiveCategory(item.id)); }
  function renameSub(item) { const value = window.prompt('Rename subcategory', item.name); if (value?.trim()) run(() => client.updateSubCategory(item.id, value.trim())); }
  function archiveSub(item) { if (window.confirm(`Archive “${item.name}”? Existing transactions remain in your history.`)) run(() => client.archiveSubCategory(item.id)); }
  function addSub(category) { const value = subNames[category.id]?.trim(); if (value) run(async () => { await client.createSubCategory(category.id, value); setSubNames((s) => ({ ...s, [category.id]: '' })); }); }
  async function addCreditSource(e) { e.preventDefault(); if (!creditSourceName.trim()) return; await run(async () => { await client.createCreditSource(creditSourceName.trim()); setCreditSourceName(''); }); }
  function renameCreditSource(source) { const value = window.prompt('Rename credit source', source.name); if (value?.trim()) run(() => client.updateCreditSource(source.id, value.trim())); }
  function archiveCreditSource(source) { if (window.confirm(`Archive “${source.name}”? It will be unavailable for new credit transactions. Existing transactions remain in your history.`)) run(() => client.archiveCreditSource(source.id)); }
  function addCreditSub(source) { const value = creditSubNames[source.id]?.trim(); if (value) run(async () => { await client.createCreditSubCategory(source.id, value); setCreditSubNames((s) => ({ ...s, [source.id]: '' })); }); }
  function renameCreditSub(sub) { const value = window.prompt('Rename credit subcategory', sub.name); if (value?.trim()) run(() => client.updateCreditSubCategory(sub.id, value.trim())); }
  function archiveCreditSub(sub) { if (window.confirm(`Archive “${sub.name}”? Existing transactions remain in your history.`)) run(() => client.archiveCreditSubCategory(sub.id)); }

  return <Layout history={history}>
    <header className="mb-6"><p className="text-sm text-foreground/55">Personalize your transaction labels</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Manage Categories</h1><p className="mt-2 max-w-xl text-sm text-foreground/60">Manage debit categories and credit sources separately. Archived labels stay with past transactions.</p></header>
    {error && <p role="alert" className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    <h2 className="mb-3 text-lg font-semibold">Debit categories</h2>
    <Card className="mb-5">
      <form onSubmit={addCategory} className="flex flex-col gap-3 sm:flex-row"><label className="flex-1 text-sm font-medium">New category<input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="e.g. Health" className="mt-2 h-12 w-full rounded-xl border bg-card px-4" /></label><Button className="min-h-12 self-end" disabled={!name.trim()}><Plus size={18} /> Add debit category</Button></form>
    </Card>
    <div className="space-y-3">{categories.map((category) => <Card key={category.id} className={category.active ? '' : 'opacity-65'}>
      <div className="flex items-center gap-2">
        <button className="flex min-h-12 min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={!!expanded[category.id]} onClick={() => setExpanded((x) => ({ ...x, [category.id]: !x[category.id] }))}>
          {expanded[category.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}<span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Tag size={18} /></span><span className="min-w-0"><strong className="block truncate">{category.name}</strong><span className="text-xs text-foreground/55">{category.subCategories.length} subcategories{category.active ? '' : ' · Archived'}</span></span>
        </button>
        {category.active && <div className="flex shrink-0"><Button variant="ghost" size="icon" onClick={() => renameCategory(category)} aria-label={`Rename ${category.name}`}><Pencil size={17} /></Button><Button variant="ghost" size="icon" onClick={() => archiveCategory(category)} aria-label={`Archive ${category.name}`}><Archive size={17} /></Button></div>}
      </div>
      {expanded[category.id] && <div className="mt-3 border-t pt-3">
        {category.subCategories.length > 0 ? <ul className="space-y-1">{category.subCategories.map((sub) => <li key={sub.id} className="flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 text-sm hover:bg-muted"><span className={sub.active ? '' : 'text-foreground/50 line-through'}>{sub.name}{!sub.active && ' · Archived'}</span>{sub.active && <span className="flex"><Button variant="ghost" size="icon" onClick={() => renameSub(sub)} aria-label={`Rename ${sub.name}`}><Pencil size={15} /></Button><Button variant="ghost" size="icon" onClick={() => archiveSub(sub)} aria-label={`Archive ${sub.name}`}><Archive size={15} /></Button></span>}</li>)}</ul> : <p className="px-3 py-2 text-sm text-foreground/55">No subcategories yet.</p>}
        {category.active && <form onSubmit={(e) => { e.preventDefault(); addSub(category); }} className="mt-3 flex gap-2"><input aria-label={`New subcategory for ${category.name}`} value={subNames[category.id] || ''} onChange={(e) => setSubNames((s) => ({ ...s, [category.id]: e.target.value }))} maxLength={80} placeholder="Add a subcategory" className="h-11 min-w-0 flex-1 rounded-xl border bg-card px-3 text-sm" /><Button variant="secondary" className="min-h-11" disabled={!subNames[category.id]?.trim()}><Plus size={16} />Add</Button></form>}
      </div>}
    </Card>)}</div>
    <section className="mt-8">
      <header className="mb-3"><h2 className="text-lg font-semibold">Credit sources</h2><p className="mt-1 text-sm text-foreground/60">Use these to label income and other credit transactions.</p></header>
      <Card className="mb-4">
        <form onSubmit={addCreditSource} className="flex flex-col gap-3 sm:flex-row"><label className="flex-1 text-sm font-medium">New credit source<input value={creditSourceName} onChange={(e) => setCreditSourceName(e.target.value)} maxLength={120} placeholder="e.g. Freelance income" className="mt-2 h-12 w-full rounded-xl border bg-card px-4" /></label><Button className="min-h-12 self-end" disabled={!creditSourceName.trim()}><Plus size={18} /> Add credit source</Button></form>
      </Card>
      <div className="space-y-3">{creditSources.map((source) => {
        const sourceKey = `credit-${source.id}`;
        const isExpanded = !!expanded[sourceKey];
        return <Card key={source.id} className={source.active ? '' : 'opacity-65'}>
          <div className="flex items-center gap-2">
            <button className="flex min-h-12 min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={isExpanded} onClick={() => setExpanded((x) => ({ ...x, [sourceKey]: !x[sourceKey] }))}>
              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-success/10 text-success"><CircleDollarSign size={18} /></span>
              <span className="min-w-0"><strong className={`block truncate ${source.active ? '' : 'line-through'}`}>{source.name}</strong><span className="text-xs text-foreground/55">{source.subCategories.length} subcategories{source.active ? '' : ' · Archived'}</span></span>
            </button>
            {source.active && <div className="flex shrink-0"><Button variant="ghost" size="icon" onClick={() => renameCreditSource(source)} aria-label={`Rename ${source.name}`}><Pencil size={17} /></Button><Button variant="ghost" size="icon" onClick={() => archiveCreditSource(source)} aria-label={`Archive ${source.name}`}><Archive size={17} /></Button></div>}
          </div>
          {isExpanded && <div className="mt-3 border-t pt-3">
            {source.subCategories.length > 0 ? <ul className="space-y-1">{source.subCategories.map((sub) => <li key={sub.id} className="flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 text-sm hover:bg-muted">
              <span className={sub.active ? '' : 'text-foreground/50 line-through'}>{sub.name}{!sub.active && ' · Archived'}</span>
              {source.active && sub.active && <span className="flex"><Button variant="ghost" size="icon" onClick={() => renameCreditSub(sub)} aria-label={`Rename ${sub.name}`}><Pencil size={15} /></Button><Button variant="ghost" size="icon" onClick={() => archiveCreditSub(sub)} aria-label={`Archive ${sub.name}`}><Archive size={15} /></Button></span>}
            </li>)}</ul> : <p className="px-3 py-2 text-sm text-foreground/55">No subcategories yet.</p>}
            {source.active && <form onSubmit={(e) => { e.preventDefault(); addCreditSub(source); }} className="mt-3 flex gap-2 border-t pt-3">
              <input aria-label={`New subcategory for ${source.name}`} value={creditSubNames[source.id] || ''} onChange={(e) => setCreditSubNames((s) => ({ ...s, [source.id]: e.target.value }))} maxLength={80} placeholder="Add a subcategory" className="h-11 min-w-0 flex-1 rounded-xl border bg-card px-3 text-sm" />
              <Button variant="secondary" className="min-h-11" disabled={!creditSubNames[source.id]?.trim()}><Plus size={16} /> Add</Button>
            </form>}
          </div>}
        </Card>;
      })}</div>
      {creditSources.length === 0 && <p className="rounded-xl border p-4 text-sm text-foreground/55">No credit sources yet. Add one to label incoming transactions.</p>}
    </section>
  </Layout>;
}
