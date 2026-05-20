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
    public ChatMessage saveMessage(Mission mission, AgencyEmployee sender, String text) {
        ChatMessage message = new ChatMessage();
        message.setMission(mission);
        message.setSender(sender);
        message.setMessageText(text);
        message.setTimestamp(LocalDateTime.now());
        message.setIsRead(false);

        return chatMessageRepository.save(message);
    }

    public List<ChatMessage> getChatHistory(Long missionId) {
        return chatMessageRepository.findByMissionIdOrderByTimestampAsc(missionId);
    }

    /**
     * פונקציה מעודכנת ויעילה שמשתמשת בשאילתת העדכון של ה-DB
     */
    @Transactional
    public void markMessagesAsRead(Long missionId) {
        chatMessageRepository.markAllAsReadForMission(missionId);
    }

    public List<ChatMessage> getChatHistoryByMissionAndSender(Long missionId, Long senderId) {
        return chatMessageRepository.findByMissionIdAndSenderIdOrderByTimestampAsc(missionId, senderId);
    }

    public ChatMessage getLastMessageByMission(Long missionId) {
        return chatMessageRepository.findFirstByMissionIdOrderByTimestampDesc(missionId);
    }

    public long getUnreadMessagesCount(Long missionId) {
        return chatMessageRepository.countByMissionIdAndIsReadFalse(missionId);
    }
}