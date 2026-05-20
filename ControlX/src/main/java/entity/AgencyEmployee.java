package entity;
import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonSubTypes;

@Entity
@Table(name = "employees")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "employee_type", discriminatorType = DiscriminatorType.STRING)
@Data
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "employee_type")
@JsonSubTypes({
        @JsonSubTypes.Type(value = FieldAgent.class, name = "AGENT"),
        @JsonSubTypes.Type(value = DeskManager.class, name = "MANAGER")
})
public class AgencyEmployee {

    public enum ClearanceLevel {
        STANDARD, //סיווג בסיסי
        CONFIDENTIAL,//שמור
        SECRET,//סודי
        TOP_SECRET,//סודי ביותר
        COSMIC //רמת הסודיות הגבוהה ביותר
    }
    public enum Department {
        CYBER,          // יחידת סייבר
        INTELLIGENCE,   // אגף מודיעין
        OPERATIONS,     // אגף מבצעים
        LOGISTICS       // לוגיסטיקה וציוד
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    private String fullName;

    @Enumerated(EnumType.STRING)
    private ClearanceLevel clearanceLevel;

    @Enumerated(EnumType.STRING)
    private Department department;
}