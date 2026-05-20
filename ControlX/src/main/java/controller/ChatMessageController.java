package controller;

import entity.ChatMessage;
import entity.Mission;
import entity.AgencyEmployee;
import service.ChatMessageService;
import repository.MissionRepository;
import repository.AgencyEmployeeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
// יבוא של רכיב השידור בזמן אמת
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatMessageController {

    private final ChatMessageService chatMessageService;
    private final MissionRepository missionRepository;
    private final AgencyEmployeeRepository employeeRepository;
    // הכלי שישמש אותנו לדחוף הודעות בזמן אמת לריאקט
    private final SimpMessagingTemplate messagingTemplate;

    // קונסטרקטור מעודכן עם הזרקה של רכיב השידור
    public ChatMessageController(ChatMessageService chatMessageService,
                                 MissionRepository missionRepository,
                                 AgencyEmployeeRepository employeeRepository,
                                 SimpMessagingTemplate messagingTemplate) {
        this.chatMessageService = chatMessageService;
        this.missionRepository = missionRepository;
        this.employeeRepository = employeeRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public static class MessageRequest {
        public Long missionId;
        public Long senderId;
        public Long recipientId;
        public String text;
    }

    // 1. שליחת הודעה + שידור אוטומטי בזמן אמת!
    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestBody MessageRequest request) {
        Mission mission = missionRepository.findById(request.missionId)
                .orElseThrow(() -> new RuntimeException("Mission not found"));
        AgencyEmployee sender = employeeRepository.findById(request.senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        AgencyEmployee recipient = employeeRepository.findById(request.recipientId)
                .orElseThrow(() -> new RuntimeException("Recipient not found"));

        // א. שומרים את ההודעה בדאטה-בייס בשיטה הפרטית המעולה שלך
        ChatMessage savedMessage = chatMessageService.saveMessage(mission, sender, recipient, request.text);

        // ב. הקסם קורה פה! משדרים את ההודעה ישירות לערוץ של הנמען
        // הכתובת תהיה למשל: /topic/messages/mission/5/user/10
        String destination = "/topic/messages/mission/" + request.missionId + "/user/" + request.recipientId;
        messagingTemplate.convertAndSend(destination, savedMessage);

        return ResponseEntity.ok(savedMessage);
    }

    // 2. שליפת היסטוריית שיחה פרטית
    @GetMapping("/mission/{missionId}/between/{user1Id}/and/{user2Id}")
    public ResponseEntity<List<ChatMessage>> getPrivateChat(
            @PathVariable Long missionId,
            @PathVariable Long user1Id,
            @PathVariable Long user2Id) {

        List<ChatMessage> messages = chatMessageService.getPrivateChatHistory(missionId, user1Id, user2Id);
        return ResponseEntity.ok(messages);
    }

    // 3. סימון הודעות כ"נקראו"
    @PostMapping("/mission/{missionId}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable Long missionId,
            @RequestParam Long senderId,
            @RequestParam Long myId) {

        chatMessageService.markPrivateMessagesAsRead(missionId, senderId, myId);
        return ResponseEntity.ok().build();
    }

    // 4. כמות הודעות שלא נקראו עבור התראות
    @GetMapping("/mission/{missionId}/unread")
    public ResponseEntity<Long> getUnreadCount(
            @PathVariable Long missionId,
            @RequestParam Long senderId,
            @RequestParam Long myId) {

        long count = chatMessageService.getUnreadPrivateMessagesCount(missionId, senderId, myId);
        return ResponseEntity.ok(count);
    }

    // 5. תצוגה מקדימה של הודעה אחרונה
    @GetMapping("/mission/{missionId}/last")
    public ResponseEntity<ChatMessage> getLastMessage(@PathVariable Long missionId) {
        ChatMessage lastMessage = chatMessageService.getLastMessageByMission(missionId);
        return ResponseEntity.ok(lastMessage);
    }
}