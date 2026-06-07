package exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    // טיפול בשגיאות של ערכים לא חוקיים
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        ex.printStackTrace();
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("status", HttpStatus.BAD_REQUEST.value()); // קוד 400
        errorResponse.put("error", "Bad Request");
        errorResponse.put("message", "הערך שהוזן אינו תואם להגדרות המערכת: " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    // טיפול כללי בכל שאר השגיאות הלא צפויות
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneralException(Exception ex) {
        ex.printStackTrace();
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value()); // קוד 500
        errorResponse.put("error", "Internal Server Error");
        errorResponse.put("message", "התרחשה שגיאה פנימית במערכת. אנא נסה שוב מאוחר יותר.");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
}