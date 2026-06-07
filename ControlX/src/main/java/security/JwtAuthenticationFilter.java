package security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import service.JwtService;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        if (path.startsWith("/ws-chat")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final Long employeeId;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7); // בידוד הטוקן

        try {
            employeeId = jwtService.extractEmployeeId(jwt);//שליפת ID של המשתמש

            // אם מצאנו ID והמשתמש עדיין לא מאומת בבקשה הנוכחית
            if (employeeId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                if (jwtService.isTokenValid(jwt)) {
                    String role = jwtService.extractRole(jwt); // חילוץ התפקיד

                    // יוצרים אובייקט אימות
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            employeeId,
                            null,
                            Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role))
                    );
                    //מעתיקים לאוביקט עוד פרטים מהבקשה
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // מעדכנים את מערכת האבטחה שהמשתמש מורשה לפעולה הזו
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            System.out.println("JWT verification failed: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}