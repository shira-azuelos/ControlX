package entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
@Data
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String messageText;

    private LocalDateTime timestamp;

    private Boolean isRead = false;

    @ManyToOne
    @JoinColumn(name = "mission_id")
    @JsonIgnore
    private Mission mission;

    @ManyToOne
    @JoinColumn(name = "sender_id")
    private AgencyEmployee sender;
}