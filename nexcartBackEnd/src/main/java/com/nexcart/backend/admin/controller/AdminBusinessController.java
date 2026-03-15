package com.nexcart.backend.admin.controller;

import com.nexcart.backend.admin.service.AdminBusinessService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/admin/business")
public class AdminBusinessController {

    private final AdminBusinessService adminBusinessService;

    public AdminBusinessController(AdminBusinessService adminBusinessService) {
        this.adminBusinessService = adminBusinessService;
    }

    @GetMapping("/monthly")
    public ResponseEntity<?> getMonthlyBusiness(@RequestParam int month, @RequestParam int year) {
        try {
            Map<String, Object> businessReport = adminBusinessService.calculateMonthlyBusiness(month, year);
            return ResponseEntity.status(HttpStatus.OK).body(businessReport);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Something went wrong");
        }
    }
    
    @GetMapping("/daily")
    public ResponseEntity<?> getDailyBusiness(@RequestParam String date) {
        try {
            LocalDate localDate = LocalDate.parse(date); // Parse the input date string
            Map<String, Object> businessReport = adminBusinessService.calculateDailyBusiness(localDate);
            return ResponseEntity.status(HttpStatus.OK).body(businessReport);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Something went wrong");
        }
    }
    
    
    
    @GetMapping("/yearly")
    public ResponseEntity<?> getYearlyBusiness(@RequestParam int year) {
        try {
            Map<String, Object> businessReport = adminBusinessService.calculateYearlyBusiness(year);
            return ResponseEntity.status(HttpStatus.OK).body(businessReport);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Something went wrong");
        }
    }
    
    
    @GetMapping("/overall")
    public ResponseEntity<?> getOverallBusiness() {
        try {
            Map<String, Object> overallBusiness = adminBusinessService.calculateOverallBusiness();
            return ResponseEntity.status(HttpStatus.OK).body(overallBusiness);
        } catch (Exception e) {
        	e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Something went wrong while calculating overall business");
        }
    }
    
}


