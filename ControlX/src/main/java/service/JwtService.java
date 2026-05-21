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

    private static final Key SECRET_KEY = Keys.secretKeyFor(SignatureAlgorithm.HS256);//מייצר מפתח הצפנה

    // תוקף הטוקן: 24 שעות
    private static final long JWT_EXPIRATION = 1000 * 60 * 60 * 24;

    public String generateToken(Long employeeId, String role, String fullName) {  // יצירת טוקן
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

    public Long extractEmployeeId(String token) { //חילוץ הID של העובד
        return Long.parseLong(extractClaim(token, Claims::getSubject));
    }

    public String extractRole(String token) { //חילוץ תפקיד העובד
        return extractAllClaims(token).get("role", String.class);
    }

    public boolean isTokenValid(String token) {//בדיקת תוקף הטוקן
        return !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {//מחזירה את המידע המבוקש מהטוקן
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) { //פיענוח הטוקן
        return Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}