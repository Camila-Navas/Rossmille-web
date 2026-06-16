package com.rossmille.controller;

import com.rossmille.dto.ApiResponse;
import com.rossmille.dto.DashboardDTO;
import com.rossmille.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/resumen")
    public ResponseEntity<ApiResponse<DashboardDTO>> resumen() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.obtenerResumen()));
    }
}
