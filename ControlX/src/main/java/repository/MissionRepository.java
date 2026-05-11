package repository;

import entity.Mission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MissionRepository extends JpaRepository<Mission, Long> {
    // השורה הזו מאפשרת שליפת משימות אך ורק של המנהל שיצר אותן
    List<Mission> findByCreatorManagerId(Long managerId);
}