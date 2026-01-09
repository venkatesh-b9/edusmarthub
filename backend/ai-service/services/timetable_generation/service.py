"""
AI-Powered Timetable Generation Service
Uses Genetic Algorithm for optimal scheduling
"""
import random
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from dataclasses import dataclass
from datetime import time, timedelta
import logging
import copy

logger = logging.getLogger(__name__)

@dataclass
class Period:
    """Represents a single period in a timetable"""
    day_of_week: int  # 0=Sunday, 1=Monday, ..., 6=Saturday
    period_number: int
    start_time: str
    end_time: str
    subject_id: str
    teacher_id: Optional[str]
    room_id: Optional[str]
    section_id: str

@dataclass
class Constraint:
    """Timetable constraints"""
    max_periods_per_day: int = 8
    max_consecutive_periods: int = 3
    avoid_back_to_back_subjects: bool = True
    max_teacher_periods_per_day: int = 6
    max_teacher_periods_per_week: int = 25
    lunch_break_required: bool = True
    min_free_periods_per_teacher: int = 2

@dataclass
class TimetableSolution:
    """Represents a complete timetable solution"""
    periods: List[Period]
    fitness_score: float = 0.0
    conflicts: List[Dict[str, Any]] = None

    def __post_init__(self):
        if self.conflicts is None:
            self.conflicts = []

class TimetableGenerator:
    """Genetic Algorithm-based Timetable Generator"""
    
    def __init__(
        self,
        sections: List[Dict[str, Any]],
        teachers: List[Dict[str, Any]],
        subjects: List[Dict[str, Any]],
        rooms: List[Dict[str, Any]],
        school_timing: Dict[str, Any],
        break_schedules: List[Dict[str, Any]],
        constraints: Optional[Constraint] = None
    ):
        self.sections = sections
        self.teachers = teachers
        self.subjects = subjects
        self.rooms = rooms
        self.school_timing = school_timing
        self.break_schedules = break_schedules
        self.constraints = constraints or Constraint()
        
        # Create lookup dictionaries
        self.teacher_map = {t['id']: t for t in teachers}
        self.subject_map = {s['id']: s for s in subjects}
        self.room_map = {r['id']: r for r in rooms}
        self.section_map = {s['id']: s for s in sections}
        
        # Extract school days from bitmask
        self.school_days = self._extract_days_from_bitmask(school_timing.get('school_days', 62))
        
        # Period structure
        self.period_duration = school_timing.get('period_duration_minutes', 45)
        self.total_periods = school_timing.get('total_periods', 8)
        self.start_time = self._parse_time(school_timing.get('start_time', '08:00:00'))
        self.end_time = self._parse_time(school_timing.get('end_time', '15:00:00'))
        
    def _extract_days_from_bitmask(self, bitmask: int) -> List[int]:
        """Extract day numbers from bitmask (1=Sunday, 2=Monday, etc.)"""
        days = []
        for i in range(7):
            if bitmask & (1 << i):
                days.append(i)
        return days if days else [1, 2, 3, 4, 5]  # Default: Mon-Fri
    
    def _parse_time(self, time_str: str) -> time:
        """Parse time string to time object"""
        parts = time_str.split(':')
        return time(int(parts[0]), int(parts[1]), int(parts[2]) if len(parts) > 2 else 0)
    
    def generate(
        self,
        population_size: int = 100,
        generations: int = 1000,
        mutation_rate: float = 0.1,
        crossover_rate: float = 0.8,
        elite_size: int = 20
    ) -> TimetableSolution:
        """Generate timetable using genetic algorithm"""
        logger.info(f"Starting timetable generation: {population_size} individuals, {generations} generations")
        
        # Initialize population
        population = self._initialize_population(population_size)
        
        # Evaluate initial population
        for solution in population:
            solution.fitness_score = self._calculate_fitness(solution)
        
        # Sort by fitness
        population.sort(key=lambda x: x.fitness_score, reverse=True)
        
        best_fitness_history = []
        
        # Evolution loop
        for generation in range(generations):
            # Select elite
            elite = population[:elite_size]
            
            # Create new population
            new_population = elite.copy()
            
            # Generate offspring
            while len(new_population) < population_size:
                # Selection
                parent1 = self._tournament_selection(population)
                parent2 = self._tournament_selection(population)
                
                # Crossover
                if random.random() < crossover_rate:
                    child1, child2 = self._crossover(parent1, parent2)
                else:
                    child1, child2 = copy.deepcopy(parent1), copy.deepcopy(parent2)
                
                # Mutation
                if random.random() < mutation_rate:
                    child1 = self._mutate(child1)
                if random.random() < mutation_rate:
                    child2 = self._mutate(child2)
                
                # Evaluate children
                child1.fitness_score = self._calculate_fitness(child1)
                child2.fitness_score = self._calculate_fitness(child2)
                
                new_population.extend([child1, child2])
            
            # Trim to population size
            new_population = new_population[:population_size]
            new_population.sort(key=lambda x: x.fitness_score, reverse=True)
            
            population = new_population
            best_fitness = population[0].fitness_score
            best_fitness_history.append(best_fitness)
            
            # Log progress
            if generation % 100 == 0 or generation == generations - 1:
                logger.info(f"Generation {generation}: Best fitness = {best_fitness:.2f}, "
                           f"Conflicts = {len(population[0].conflicts)}")
            
            # Early stopping if perfect solution
            if best_fitness >= 0.95 and len(population[0].conflicts) == 0:
                logger.info(f"Perfect solution found at generation {generation}")
                break
        
        best_solution = population[0]
        logger.info(f"Generation complete. Best fitness: {best_solution.fitness_score:.2f}, "
                   f"Conflicts: {len(best_solution.conflicts)}")
        
        return best_solution
    
    def _initialize_population(self, size: int) -> List[TimetableSolution]:
        """Initialize random population"""
        population = []
        
        for _ in range(size):
            periods = []
            
            # Generate periods for each section
            for section in self.sections:
                section_id = section['id']
                
                # Get subjects for this section (from class assignments or curriculum)
                section_subjects = section.get('subjects', [])
                if not section_subjects:
                    # Default: use all subjects
                    section_subjects = [s['id'] for s in self.subjects]
                
                # Generate periods for each day
                for day in self.school_days:
                    period_num = 1
                    current_time = self.start_time
                    
                    for _ in range(self.total_periods):
                        # Check if this is a break time
                        if self._is_break_time(day, current_time):
                            # Skip break period
                            current_time = self._add_minutes(current_time, 15)  # Assume 15 min break
                            continue
                        
                        # Select random subject
                        subject_id = random.choice(section_subjects)
                        
                        # Select random teacher (if available)
                        teacher_id = self._select_teacher_for_subject(subject_id)
                        
                        # Select random room
                        room_id = self._select_room()
                        
                        # Create period
                        end_time = self._add_minutes(current_time, self.period_duration)
                        
                        period = Period(
                            day_of_week=day,
                            period_number=period_num,
                            start_time=current_time.strftime('%H:%M:%S'),
                            end_time=end_time.strftime('%H:%M:%S'),
                            subject_id=subject_id,
                            teacher_id=teacher_id,
                            room_id=room_id,
                            section_id=section_id
                        )
                        
                        periods.append(period)
                        period_num += 1
                        current_time = end_time
            
            solution = TimetableSolution(periods=periods)
            population.append(solution)
        
        return population
    
    def _is_break_time(self, day: int, time_obj: time) -> bool:
        """Check if given time falls in a break period"""
        for break_schedule in self.break_schedules:
            break_days = self._extract_days_from_bitmask(break_schedule.get('days', 62))
            if day not in break_days:
                continue
            
            break_start = self._parse_time(break_schedule['start_time'])
            break_end = self._parse_time(break_schedule['end_time'])
            
            if break_start <= time_obj < break_end:
                return True
        
        return False
    
    def _add_minutes(self, time_obj: time, minutes: int) -> time:
        """Add minutes to time object"""
        total_seconds = time_obj.hour * 3600 + time_obj.minute * 60 + time_obj.second
        total_seconds += minutes * 60
        
        hours = (total_seconds // 3600) % 24
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        
        return time(hours, minutes, seconds)
    
    def _select_teacher_for_subject(self, subject_id: str) -> Optional[str]:
        """Select a teacher who can teach this subject"""
        # Find teachers who can teach this subject
        available_teachers = [
            t for t in self.teachers
            if subject_id in t.get('subjects', []) or t.get('can_teach_all', False)
        ]
        
        if not available_teachers:
            return None
        
        return random.choice(available_teachers)['id']
    
    def _select_room(self) -> Optional[str]:
        """Select a random available room"""
        if not self.rooms:
            return None
        
        available_rooms = [r for r in self.rooms if r.get('is_available', True)]
        if not available_rooms:
            return None
        
        return random.choice(available_rooms)['id']
    
    def _calculate_fitness(self, solution: TimetableSolution) -> float:
        """Calculate fitness score for a solution (0-1, higher is better)"""
        conflicts = []
        score = 1.0
        
        # Check for conflicts
        conflicts.extend(self._detect_teacher_overlaps(solution))
        conflicts.extend(self._detect_room_double_bookings(solution))
        conflicts.extend(self._detect_constraint_violations(solution))
        
        solution.conflicts = conflicts
        
        # Penalize conflicts
        conflict_penalty = len(conflicts) * 0.1
        score -= conflict_penalty
        
        # Reward good distribution
        distribution_score = self._calculate_distribution_score(solution)
        score += distribution_score * 0.2
        
        # Reward workload balance
        balance_score = self._calculate_workload_balance(solution)
        score += balance_score * 0.1
        
        # Ensure score is between 0 and 1
        score = max(0.0, min(1.0, score))
        
        return score
    
    def _detect_teacher_overlaps(self, solution: TimetableSolution) -> List[Dict[str, Any]]:
        """Detect if a teacher is assigned to multiple classes at the same time"""
        conflicts = []
        teacher_schedule = {}
        
        for period in solution.periods:
            if not period.teacher_id:
                continue
            
            key = (period.day_of_week, period.start_time, period.end_time)
            
            if period.teacher_id not in teacher_schedule:
                teacher_schedule[period.teacher_id] = {}
            
            if key in teacher_schedule[period.teacher_id]:
                conflicts.append({
                    'type': 'teacher_overlap',
                    'severity': 'error',
                    'teacher_id': period.teacher_id,
                    'periods': [teacher_schedule[period.teacher_id][key], period],
                    'message': f'Teacher {period.teacher_id} is double-booked'
                })
            else:
                teacher_schedule[period.teacher_id][key] = period
        
        return conflicts
    
    def _detect_room_double_bookings(self, solution: TimetableSolution) -> List[Dict[str, Any]]:
        """Detect if a room is double-booked"""
        conflicts = []
        room_schedule = {}
        
        for period in solution.periods:
            if not period.room_id:
                continue
            
            key = (period.day_of_week, period.start_time, period.end_time)
            
            if period.room_id not in room_schedule:
                room_schedule[period.room_id] = {}
            
            if key in room_schedule[period.room_id]:
                conflicts.append({
                    'type': 'room_double_booking',
                    'severity': 'error',
                    'room_id': period.room_id,
                    'periods': [room_schedule[period.room_id][key], period],
                    'message': f'Room {period.room_id} is double-booked'
                })
            else:
                room_schedule[period.room_id][key] = period
        
        return conflicts
    
    def _detect_constraint_violations(self, solution: TimetableSolution) -> List[Dict[str, Any]]:
        """Detect constraint violations"""
        conflicts = []
        
        # Group periods by section and day
        section_day_periods = {}
        for period in solution.periods:
            key = (period.section_id, period.day_of_week)
            if key not in section_day_periods:
                section_day_periods[key] = []
            section_day_periods[key].append(period)
        
        # Check max periods per day
        for (section_id, day), periods in section_day_periods.items():
            if len(periods) > self.constraints.max_periods_per_day:
                conflicts.append({
                    'type': 'max_periods_violation',
                    'severity': 'warning',
                    'section_id': section_id,
                    'day': day,
                    'message': f'Section {section_id} has {len(periods)} periods on day {day}'
                })
        
        # Check teacher workload
        teacher_periods = {}
        for period in solution.periods:
            if period.teacher_id:
                if period.teacher_id not in teacher_periods:
                    teacher_periods[period.teacher_id] = []
                teacher_periods[period.teacher_id].append(period)
        
        for teacher_id, periods in teacher_periods.items():
            # Check per day
            teacher_day_periods = {}
            for period in periods:
                key = (period.day_of_week, period.teacher_id)
                if key not in teacher_day_periods:
                    teacher_day_periods[key] = []
                teacher_day_periods[key].append(period)
            
            for key, day_periods in teacher_day_periods.items():
                if len(day_periods) > self.constraints.max_teacher_periods_per_day:
                    conflicts.append({
                        'type': 'teacher_overwork',
                        'severity': 'warning',
                        'teacher_id': teacher_id,
                        'day': key[0],
                        'message': f'Teacher {teacher_id} has {len(day_periods)} periods on day {key[0]}'
                    })
            
            # Check per week
            if len(periods) > self.constraints.max_teacher_periods_per_week:
                conflicts.append({
                    'type': 'teacher_overwork',
                    'severity': 'warning',
                    'teacher_id': teacher_id,
                    'message': f'Teacher {teacher_id} has {len(periods)} periods per week'
                })
        
        return conflicts
    
    def _calculate_distribution_score(self, solution: TimetableSolution) -> float:
        """Calculate how well subjects are distributed across the week"""
        score = 1.0
        
        # Group periods by section and subject
        section_subject_periods = {}
        for period in solution.periods:
            key = (period.section_id, period.subject_id)
            if key not in section_subject_periods:
                section_subject_periods[key] = []
            section_subject_periods[key].append(period)
        
        # Check distribution (avoid clustering)
        for (section_id, subject_id), periods in section_subject_periods.items():
            days = [p.day_of_week for p in periods]
            
            # Penalize if same subject on consecutive days
            if self.constraints.avoid_back_to_back_subjects:
                for i in range(len(days) - 1):
                    if abs(days[i] - days[i+1]) == 1:
                        score -= 0.05
        
        return max(0.0, score)
    
    def _calculate_workload_balance(self, solution: TimetableSolution) -> float:
        """Calculate how balanced teacher workloads are"""
        teacher_periods = {}
        for period in solution.periods:
            if period.teacher_id:
                if period.teacher_id not in teacher_periods:
                    teacher_periods[period.teacher_id] = 0
                teacher_periods[period.teacher_id] += 1
        
        if not teacher_periods:
            return 1.0
        
        # Calculate variance in workload
        workloads = list(teacher_periods.values())
        mean_workload = np.mean(workloads)
        variance = np.var(workloads)
        
        # Lower variance = better balance
        balance_score = 1.0 / (1.0 + variance / 100.0)
        
        return balance_score
    
    def _tournament_selection(self, population: List[TimetableSolution], tournament_size: int = 5) -> TimetableSolution:
        """Tournament selection"""
        tournament = random.sample(population, min(tournament_size, len(population)))
        return max(tournament, key=lambda x: x.fitness_score)
    
    def _crossover(self, parent1: TimetableSolution, parent2: TimetableSolution) -> Tuple[TimetableSolution, TimetableSolution]:
        """Crossover two solutions"""
        # Single-point crossover
        crossover_point = random.randint(1, min(len(parent1.periods), len(parent2.periods)) - 1)
        
        child1_periods = parent1.periods[:crossover_point] + parent2.periods[crossover_point:]
        child2_periods = parent2.periods[:crossover_point] + parent1.periods[crossover_point:]
        
        child1 = TimetableSolution(periods=child1_periods)
        child2 = TimetableSolution(periods=child2_periods)
        
        return child1, child2
    
    def _mutate(self, solution: TimetableSolution) -> TimetableSolution:
        """Mutate a solution"""
        mutated = copy.deepcopy(solution)
        
        # Randomly swap some periods
        if len(mutated.periods) > 1:
            num_swaps = random.randint(1, min(5, len(mutated.periods) // 2))
            for _ in range(num_swaps):
                idx1, idx2 = random.sample(range(len(mutated.periods)), 2)
                mutated.periods[idx1], mutated.periods[idx2] = mutated.periods[idx2], mutated.periods[idx1]
        
        # Randomly change some teachers/rooms
        for period in mutated.periods:
            if random.random() < 0.1:  # 10% chance
                period.teacher_id = self._select_teacher_for_subject(period.subject_id)
            if random.random() < 0.1:  # 10% chance
                period.room_id = self._select_room()
        
        return mutated
    
    def solution_to_dict(self, solution: TimetableSolution) -> Dict[str, Any]:
        """Convert solution to dictionary format for API response"""
        return {
            'periods': [
                {
                    'day_of_week': p.day_of_week,
                    'period_number': p.period_number,
                    'start_time': p.start_time,
                    'end_time': p.end_time,
                    'subject_id': p.subject_id,
                    'teacher_id': p.teacher_id,
                    'room_id': p.room_id,
                    'section_id': p.section_id,
                }
                for p in solution.periods
            ],
            'fitness_score': solution.fitness_score,
            'conflicts': solution.conflicts,
            'statistics': {
                'total_periods': len(solution.periods),
                'conflict_count': len(solution.conflicts),
                'critical_conflicts': len([c for c in solution.conflicts if c.get('severity') == 'error']),
            }
        }
