package entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "missions")
@Data
public class Mission {

    public enum MissionStatus {
        PENDING,//בהמתנה
        IN_PROGRESS,//במהלך
        COMPLETED,//הושלם
        ABORTED//בוטל
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    @Lob
    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    private MissionStatus status= MissionStatus.PENDING;

    //  הסיכום המאוחד מכל הדיווחים של כל הסוכנים מ-AI
    @Column(columnDefinition = "TEXT")
    private String aiIntelligenceSummary;

    @ManyToOne
    @JoinColumn(name = "creator_manager_id")
    private DeskManager creatorManager;

    @ManyToMany
    @JoinTable(
            name = "mission_agents",
            joinColumns = @JoinColumn(name = "mission_id"),
            inverseJoinColumns = @JoinColumn(name = "agent_id")
    )
    private List<FieldAgent> assignedAgents = new ArrayList<>();


    @OneToMany(mappedBy = "mission", cascade = CascadeType.ALL)
    private List<Report> reports = new ArrayList<>();

    private LocalDateTime startedAt;
}