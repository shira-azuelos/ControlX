package service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    // מפתח הצפנה סודי (במציאות שומרים אותו בקובץ properties)
    private static final Key SECRET_KEY = Keys.secretKeyFor(SignatureAlgorithm.HS256);

    // תוקף הטוקן: 24 שעות
    private static final long JWT_EXPIRATION = 1000 * 60 * 60 * 24;

    // 1. יצירת טוקן על פי ה-ID והתפקיד של העובד
    public String generateToken(Long employeeId, String role, String fullName) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        claims.put("fullName", fullName);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(employeeId.toString())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + JWT_EXPIRATION))
                .signWith(SECRET_KEY, SignatureAlgorithm.HS256)
                .compact();
    }

    // 2. חילוץ ה-ID של המשתמש מתוך הטוקן
    public Long extractEmployeeId(String token) {
        return Long.parseLong(extractClaim(token, Claims::getSubject));
    }

    // 3. חילוץ תפקיד המשתמש מתוך הטוקן
    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    // 4. בדיקה האם הטוקן בתוקף ולא פג
    public boolean isTokenValid(String token) {
        return !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}