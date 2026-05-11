package service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;
    private final String URL = "https://router.huggingface.co/v1/chat/completions";

    public String summarizeReports(String prompt) {
        RestTemplate restTemplate = new RestTemplate();

        String instruction = "אתה קצין מודיעין בכיר. קרא את דיווחי השטח הבאים וכתוב מהם דוח מודיעיני מפורט, רשמי ומעמיק. עליך לכלול בטקסט את כל הפרטים הקטנים: זמנים מדויקים, תיאור הרכבים, כלי הנשק, תיאור החשודים, המיקומים והפעולות שבוצעו בשטח. כתוב את הדוח כטקסט פשוט וזורם בפסקה אחת רציפה וארוכה. אל תשתמש בכוכביות, אל תשתמש בכותרות ואל תרד שורות.\n\nהדיווח:\n" + prompt;
        Map<String, Object> message = Map.of(
                "role", "user",
                "content", instruction
        );

        Map<String, Object> requestBody = Map.of(
                "model", "Qwen/Qwen2.5-72B-Instruct",
                "messages", List.of(message),
                "max_tokens", 500,
                "temperature", 0.2
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        headers.set("Authorization", "Bearer " + apiKey);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            System.out.println("שולח בקשה למודל Qwen החכם בעברית...");

            Map response = restTemplate.postForObject(URL, request, Map.class);

            if (response != null && response.containsKey("choices")) {
                List choices = (List) response.get("choices");
                Map firstChoice = (Map) choices.get(0);
                Map messageObj = (Map) firstChoice.get("message");
                String result = (String) messageObj.get("content");

                result = result.replace("**", "")
                        .replace("###", "")
                        .replace("\n", " ")
                        .trim();

                System.out.println("ה-AI החזיר בעברית: " + result);
                return result;
            }
            return "לא התקבלה תשובה מ-Hugging Face.";

        } catch (Exception e) {
            System.err.println("שגיאת AI: " + e.getMessage());
            return "שגיאת AI: " + e.getMessage();
        }
    }
}