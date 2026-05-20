package repository;

import entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // 1. בשביל חלון הצ'אט הפתוח (מביא את כל השיחה של המשימה כרונולוגית)
    List<ChatMessage> findByMissionIdOrderByTimestampAsc(Long missionId);

    @Modifying
    @Query("UPDATE ChatMessage c SET c.isRead = true WHERE c.mission.id = :missionId AND c.isRead = false")
    void markAllAsReadForMission(Long missionId);

    // 3. בשביל לדעת מה ההודעה האחרונה שנשלחה במשימה (תצוגה מקדימה ברשימה)
    ChatMessage findFirstByMissionIdOrderByTimestampDesc(Long missionId);

    List<ChatMessage> findByMissionIdAndSenderIdOrderByTimestampAsc(Long missionId, Long senderId);
    // בתוך ChatMessageRepository
    long countByMissionIdAndIsReadFalse(Long missionId);
}