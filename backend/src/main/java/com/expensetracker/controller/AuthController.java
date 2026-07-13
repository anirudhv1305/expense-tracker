package com.expensetracker.controller;

import com.expensetracker.dto.Requests;
import com.expensetracker.dto.Responses;
import com.expensetracker.exception.ApiException;
import com.expensetracker.security.JwtService;
import com.expensetracker.security.UserPrincipal;
import com.expensetracker.user.AppUser;
import com.expensetracker.user.AppUserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @PostMapping("/register")
    public Responses.AuthResponse register(@Valid @RequestBody Requests.RegisterRequest request) {
        if (!request.password().equals(request.confirmPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Confirm password must match password");
        }
        if (appUserRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "Email is already registered");
        }
        var user = new AppUser();
        user.setName(request.name().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user = appUserRepository.save(user);
        return authResponse(user);
    }

    @PostMapping("/login")
    public Responses.AuthResponse login(@Valid @RequestBody Requests.LoginRequest request) {
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        var user = appUserRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        return authResponse(user);
    }

    private Responses.AuthResponse authResponse(AppUser user) {
        return new Responses.AuthResponse(
                jwtService.issue(UserPrincipal.from(user)),
                new Responses.AuthUser(user.getId(), user.getName(), user.getEmail())
        );
    }
}
