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

    @Transactional
    public ChatMessage saveMessage(Mission mission, AgencyEmployee sender, AgencyEmployee recipient, String text) {
        ChatMessage message = new ChatMessage();
        message.setMission(mission);
        message.setSender(sender);
        message.setRecipient(recipient);
        message.setMessageText(text);
        message.setTimestamp(LocalDateTime.now());
        message.setIsRead(false);

        return chatMessageRepository.save(message);
    }


     //  שליפת היסטוריית שיחה פרטית בין מנהל וסוכן במשימה ספציפית

    public List<ChatMessage> getPrivateChatHistory(Long missionId, Long user1Id, Long user2Id) {
        return chatMessageRepository.findPrivateChatHistory(missionId, user1Id, user2Id);
    }


    //  סימון הודעות כנקראו
    @Transactional
    public void markPrivateMessagesAsRead(Long missionId, Long senderId, Long recipientId) {
        chatMessageRepository.markPrivateMessagesAsRead(missionId, senderId, recipientId);
    }

     //  ספירת הודעות שלא נקראו
    public long getUnreadPrivateMessagesCount(Long missionId, Long senderId, Long recipientId) {
        return chatMessageRepository.countUnreadPrivateMessages(missionId, senderId, recipientId);
    }

     //  שליפת ההודעה האחרונה במשימה
    public ChatMessage getLastMessageByMission(Long missionId) {
        return chatMessageRepository.findFirstByMissionIdOrderByTimestampDesc(missionId);
    }
}