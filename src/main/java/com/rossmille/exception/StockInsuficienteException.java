package com.rossmille.exception;

public class StockInsuficienteException extends RuntimeException {

    public StockInsuficienteException(String nombreProducto, int disponible, int pedido) {
        super("Stock insuficiente para \"" + nombreProducto + "\": disponible " +
                disponible + ", solicitado " + pedido);
    }
}
