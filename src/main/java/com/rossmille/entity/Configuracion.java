package com.rossmille.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "configuracion")
@Getter
@Setter
@NoArgsConstructor
public class Configuracion {

    @Id
    @Column(name = "clave", length = 100)
    private String clave;

    @Column(name = "valor", columnDefinition = "TEXT")
    private String valor;

    @Column(name = "grupo", length = 50)
    private String grupo;

    @Column(name = "descripcion", length = 255)
    private String descripcion;

    @Column(name = "actualizado")
    private LocalDateTime actualizado;

    @PrePersist
    @PreUpdate
    public void onSave() {
        this.actualizado = LocalDateTime.now();
    }

    public Configuracion(String clave, String valor, String grupo) {
        this.clave = clave;
        this.valor = valor;
        this.grupo = grupo;
    }
}
