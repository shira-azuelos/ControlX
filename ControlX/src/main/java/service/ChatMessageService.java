package service;

import entity.ChatMessage;
import entity.Mission;
import entity.AgencyEmployee;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import repository.ChatMessageRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ChatMessageService {

    private final ChatMessageRepository chatMessageRepository;

    public ChatMessageService(ChatMessageRepository chatMessageRepository) {
        this.chatMessageRepository = chatMessageRepository;
    }

    /**
     * 1. שמירת הודעה חדשה בשיחה פרטית (כולל שולח ונמען)
     */
    @Transactional
    public ChatMessage saveMessage(Mission mission, AgencyEmployee sender, AgencyEmployee recipient, String text) {
        ChatMessage message = new ChatMessage();
        message.setMission(mission);
        message.setSender(sender);
        message.setRecipient(recipient); // השדה החדש שהוספנו!
        message.setMessageText(text);
        message.setTimestamp(LocalDateTime.now());
        message.setIsRead(false);

        return chatMessageRepository.save(message);
    }

    /**
     * 2. שליפת היסטוריית שיחה פרטית בין שני עובדים (מנהל וסוכן) במשימה ספציפית
     */
    public List<ChatMessage> getPrivateChatHistory(Long missionId, Long user1Id, Long user2Id) {
        return chatMessageRepository.findPrivateChatHistory(missionId, user1Id, user2Id);
    }

    /**
     * 3. סימון הודעות כ"נקראו"
     * (מופעל כאשר הנמען פותח את השיחה ורואה את ההודעות שהשולח שלח לו)
     */
    @Transactional
    public void markPrivateMessagesAsRead(Long missionId, Long senderId, Long recipientId) {
        chatMessageRepository.markPrivateMessagesAsRead(missionId, senderId, recipientId);
    }

    /**
     * 4. ספירת הודעות שלא נקראו
     * (כדי להציג את הבועה האדומה עם המספר ליד השם של הסוכן/מנהל)
     */
    public long getUnreadPrivateMessagesCount(Long missionId, Long senderId, Long recipientId) {
        return chatMessageRepository.countUnreadPrivateMessages(missionId, senderId, recipientId);
    }

    /**
     * 5. שליפת ההודעה האחרונה במשימה
     * (מעולה לתצוגה מקדימה במסך הראשי של המנהל, לפני שהוא נכנס למשימה עצמה)
     */
    public ChatMessage getLastMessageByMission(Long missionId) {
        return chatMessageRepository.findFirstByMissionIdOrderByTimestampDesc(missionId);
    }
}