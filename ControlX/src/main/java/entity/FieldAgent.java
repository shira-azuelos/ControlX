package entity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@DiscriminatorValue("AGENT")
@Data
@EqualsAndHashCode(callSuper = true)
public class FieldAgent extends AgencyEmployee {

    public enum AgentStatus { AVAILABLE, ON_MISSION, INJURED, ON_LEAVE }

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

    // ---> השורה שהייתה חסרה לך והפילה את ה-Service! <---
    @ManyToOne
    @JoinColumn(name = "recruiting_manager_id")
    private DeskManager recruitingManager;
}