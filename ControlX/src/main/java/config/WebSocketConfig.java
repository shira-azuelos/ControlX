package config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // יצירת צינור תקשורת
        registry.addEndpoint("/ws-chat")
                .setAllowedOriginPatterns("*")
                .withSockJS(); // רשת ביטחון למניעת ניתוקים
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // מהשרת ללקוח
        registry.enableSimpleBroker("/topic");
        //מהחקוח לשרת
        registry.setApplicationDestinationPrefixes("/app");
    }
}