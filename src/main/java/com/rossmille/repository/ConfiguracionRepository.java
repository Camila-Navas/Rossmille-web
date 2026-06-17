package com.rossmille.repository;

import com.rossmille.entity.Configuracion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConfiguracionRepository extends JpaRepository<Configuracion, String> {
    List<Configuracion> findByGrupo(String grupo);
}
