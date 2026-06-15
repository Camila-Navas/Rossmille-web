package com.rossmille.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UsuarioDTO {

    private String id;
    private String nombre;
    private String rol;
    private String correo;
    private String telefono;
    private String contrasena;
}
