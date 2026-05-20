package repository;

import entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // 1. שליפת היסטוריית שיחה פרטית בין שני עובדים במשימה (מנהל וסוכן)
    @Query("SELECT c FROM ChatMessage c WHERE c.mission.id = :missionId AND " +
            "((c.sender.id = :user1Id AND c.recipient.id = :user2Id) OR " +
            "(c.sender.id = :user2Id AND c.recipient.id = :user1Id)) " +
            "ORDER BY c.timestamp ASC")
    List<ChatMessage> findPrivateChatHistory(Long missionId, Long user1Id, Long user2Id);

    // 2. סימון הודעות כנקראו *רק* בשיחה הספציפית הזו
    @Modifying
    @Query("UPDATE ChatMessage c SET c.isRead = true WHERE c.mission.id = :missionId " +
            "AND c.sender.id = :senderId AND c.recipient.id = :recipientId AND c.isRead = false")
    void markPrivateMessagesAsRead(Long missionId, Long senderId, Long recipientId);

    // 3. ספירת הודעות שלא נקראו עבור משתמש מסוים מול סוכן מסוים במשימה
    @Query("SELECT COUNT(c) FROM ChatMessage c WHERE c.mission.id = :missionId " +
            "AND c.sender.id = :senderId AND c.recipient.id = :recipientId AND c.isRead = false")
    long countUnreadPrivateMessages(Long missionId, Long senderId, Long recipientId);

    // 4. ---> הנה הפונקציה החסרה שהחזרנו! <---
    // מביא את ההודעה האחרונה שנשלחה במשימה מסוימת (בשביל התצוגה המקדימה)
    ChatMessage findFirstByMissionIdOrderByTimestampDesc(Long missionId);
}