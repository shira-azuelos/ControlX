package entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@DiscriminatorValue("MANAGER")
@Data
@EqualsAndHashCode(callSuper = true)

public class DeskManager extends AgencyEmployee {

    private int yearsOfExperience;//ותק
}