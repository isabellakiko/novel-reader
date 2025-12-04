package com.novelreader.security;

import com.novelreader.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * 自定义 UserDetailsService 实现
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username)
            .map(CustomUserDetails::new)
            .orElseThrow(() -> new UsernameNotFoundException("用户不存在: " + username));
    }

    public UserDetails loadUserById(Long id) {
        return userRepository.findById(id)
            .map(CustomUserDetails::new)
            .orElseThrow(() -> new UsernameNotFoundException("用户不存在: " + id));
    }
}
