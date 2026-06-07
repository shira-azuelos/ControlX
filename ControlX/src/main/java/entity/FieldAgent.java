package entity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@DiscriminatorValue("AGENT")
@Data
@EqualsAndHashCode(callSuper = true)
public class FieldAgent extends AgencyEmployee {

    public enum AgentStatus {
        AVAILABLE,    //זמין
        ON_MISSION,   //במשימה
        INJURED,      //נפגע
        ON_LEAVE      //סיים
    }

    public enum Specialty {
        COMBAT,        // לחימה
        INFILTRATION,  // חדירה
        SABOTAGE,      // חבלה
        CYBER,         // סייבר כללי
        SURVEILLANCE,  // מעקב
        INTERROGATION, // חקירה
        UNDERCOVER,    // פעילות סמויה
        HACKING,       // פריצה
        ENCRYPTION,    // הצפנה
        SIGNALS,       // מודיעין אותות
        WEAPONRY,      // נשק וחימוש
        TRANSPORT,     // תעבורה ושינוע
        MEDICAL        // רפואה
    }

    private String codename;

    @Enumerated(EnumType.STRING)
    private AgentStatus status;

    @Enumerated(EnumType.STRING)
    private Specialty specialty;

    @ManyToOne
    @JoinColumn(name = "recruiting_manager_id")
    private DeskManager recruitingManager;
}