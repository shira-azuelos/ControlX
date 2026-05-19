package com.example.controlx;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.boot.autoconfigure.domain.EntityScan;

@SpringBootApplication
@ComponentScan(basePackages = {"com.example.controlx", "controller", "service", "repository","exception"})
@EnableJpaRepositories(basePackages = "repository")
@EntityScan(basePackages = "entity") //
public class ControlXApplication {

	public static void main(String[] args) {
		SpringApplication.run(ControlXApplication.class, args);
	}
}