package com.nexcart.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Value("${app.frontend.base-url:https://nex-cart-alpha.vercel.app}")
    private String frontendBaseUrl;

    @Bean
    public FilterRegistrationBean<CorsFilter> corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        // Split if multiple origins are provided
        if (frontendBaseUrl != null) {
            Arrays.stream(frontendBaseUrl.split(","))
                  .map(String::trim)
                  .forEach(config::addAllowedOriginPattern);
        } else {
            config.addAllowedOriginPattern("https://nex-cart-alpha.vercel.app");
        }
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        config.setMaxAge(36000L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        
        FilterRegistrationBean<CorsFilter> bean = new FilterRegistrationBean<>(new CorsFilter(source));
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return bean;
    }
}
