package controller;

import entity.ChatMessage;
import entity.Mission;
import entity.AgencyEmployee;
import service.ChatMessageService;
import repository.MissionRepository;
import repository.AgencyEmployeeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatMessageController {

    private final ChatMessageService chatMessageService;
    private final MissionRepository missionRepository;
    private final AgencyEmployeeRepository employeeRepository;
    private final SimpMessagingTemplate messagingTemplate;

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

    //  שליחת הודעה + שידור אוטומטי בזמן אמת
    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestBody MessageRequest request) {
        Mission mission = missionRepository.findById(request.missionId)
                .orElseThrow(() -> new RuntimeException("Mission not found"));
        AgencyEmployee sender = employeeRepository.findById(request.senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        AgencyEmployee recipient = employeeRepository.findById(request.recipientId)
                .orElseThrow(() -> new RuntimeException("Recipient not found"));

        ChatMessage savedMessage = chatMessageService.saveMessage(mission, sender, recipient, request.text);
        // שידור לצאט האישי
        String destination = "/topic/messages/mission/" + request.missionId + "/user/" + request.recipientId;
        messagingTemplate.convertAndSend(destination, savedMessage);

        // שידור להודעות הקופצות
        String globalDestination = "/topic/notifications/user/" + request.recipientId;
        messagingTemplate.convertAndSend(globalDestination, savedMessage);
        return ResponseEntity.ok(savedMessage);
    }

    // שידור הודעה לכל המשימה (Broadcast)
    @PostMapping("/broadcast")
    public ResponseEntity<?> broadcastMessage(@RequestBody MessageRequest request) {
        Mission mission = missionRepository.findById(request.missionId)
                .orElseThrow(() -> new RuntimeException("Mission not found"));
        AgencyEmployee sender = employeeRepository.findById(request.senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        ChatMessage savedMessage = chatMessageService.saveMessage(mission, sender, null, request.text);

        String broadcastDestination = "/topic/messages/mission/" + request.missionId + "/broadcast";
        messagingTemplate.convertAndSend(broadcastDestination, savedMessage);

        return ResponseEntity.ok(savedMessage);
    }

    //  שליפת היסטוריית שיחה פרטית
    @GetMapping("/mission/{missionId}/between/{user1Id}/and/{user2Id}")
    public ResponseEntity<List<ChatMessage>> getPrivateChat(
            @PathVariable Long missionId,
            @PathVariable Long user1Id,
            @PathVariable Long user2Id) {

        List<ChatMessage> messages = chatMessageService.getPrivateChatHistory(missionId, user1Id, user2Id);
        return ResponseEntity.ok(messages);
    }

    //  סימון הודעות כ"נקראו"
    @PostMapping("/mission/{missionId}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable Long missionId,
            @RequestParam Long senderId,
            @RequestParam Long myId) {

        chatMessageService.markPrivateMessagesAsRead(missionId, senderId, myId);
        return ResponseEntity.ok().build();
    }

    //  כמות הודעות שלא נקראו עבור התראות
    @GetMapping("/mission/{missionId}/unread")
    public ResponseEntity<Long> getUnreadCount(
            @PathVariable Long missionId,
            @RequestParam Long senderId,
            @RequestParam Long myId) {

        long count = chatMessageService.getUnreadPrivateMessagesCount(missionId, senderId, myId);
        return ResponseEntity.ok(count);
    }

    //  תצוגה מקדימה של הודעה אחרונה
    @GetMapping("/mission/{missionId}/last")
    public ResponseEntity<ChatMessage> getLastMessage(@PathVariable Long missionId) {
        ChatMessage lastMessage = chatMessageService.getLastMessageByMission(missionId);
        return ResponseEntity.ok(lastMessage);
    }
}