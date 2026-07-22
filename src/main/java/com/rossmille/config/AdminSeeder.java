package com.rossmille.config;

import com.rossmille.entity.Usuario;
import com.rossmille.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Crea el primer Administrador si la tabla usuarios esta vacia. Reemplaza el
 * paso manual de correr db/setup_admin.py -- necesario en Railway, donde no
 * hay una terminal interactiva para pedir el password.
 */
@Component
public class AdminSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.seed.id}")
    private String adminId;

    @Value("${admin.seed.nombre}")
    private String adminNombre;

    @Value("${admin.seed.password}")
    private String adminPassword;

    public AdminSeeder(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (usuarioRepository.count() > 0) {
            return;
        }

        if (!StringUtils.hasText(adminId) || !StringUtils.hasText(adminNombre)
                || !StringUtils.hasText(adminPassword)) {
            log.warn("La tabla 'usuarios' esta vacia y no hay ADMIN_ID/ADMIN_NOMBRE/ADMIN_PASSWORD "
                    + "configurados -- no se creo ningun administrador. Nadie podra iniciar sesion "
                    + "hasta que se inserte un usuario manualmente o se configuren esas variables "
                    + "y se reinicie la app.");
            return;
        }

        Usuario admin = new Usuario();
        admin.setIdUsuario(adminId);
        admin.setNombreUsuario(adminNombre);
        admin.setRolUsuarios("Administrador");
        admin.setContrasena(passwordEncoder.encode(adminPassword));
        usuarioRepository.save(admin);

        log.info("Administrador inicial creado: id={}, nombre={}", adminId, adminNombre);
    }
}
