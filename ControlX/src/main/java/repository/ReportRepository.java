package repository;

import entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    // מאפשר למצוא את כל הדיווחים של משימה ספציפית
    List<Report> findByMissionId(Long missionId);
}