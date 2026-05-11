package repository;

import entity.AgencyEmployee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AgencyEmployeeRepository extends JpaRepository<AgencyEmployee, Long> {
}