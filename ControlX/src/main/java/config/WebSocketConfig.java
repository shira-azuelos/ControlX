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
        // הכתובת (Endpoint) שהריאקט יפנה אליה בעתיד כדי להתחבר לצינור
        registry.addEndpoint("/ws-chat")
                .setAllowedOriginPatterns("*") // מאפשר לריאקט להתחבר מכל פורט
                .withSockJS(); // רשת ביטחון למניעת ניתוקים
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // פותח "ערוצי רדיו" (Topics) שהלקוחות יוכלו להאזין להם
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }
}