from flask import Blueprint, request, jsonify
from services.timetable_generation.service import TimetableGenerator, Constraint
from utils.auth import require_auth
import logging

logger = logging.getLogger(__name__)

timetable_bp = Blueprint('timetable_generation', __name__)

@timetable_bp.route('/generate', methods=['POST'])
@require_auth
def generate_timetable():
    """Generate timetable using AI/genetic algorithm"""
    try:
        data = request.json
        
        # Extract required data
        sections = data.get('sections', [])
        teachers = data.get('teachers', [])
        subjects = data.get('subjects', [])
        rooms = data.get('rooms', [])
        school_timing = data.get('school_timing', {})
        break_schedules = data.get('break_schedules', [])
        
        # Extract constraints
        constraints_data = data.get('constraints', {})
        constraints = Constraint(
            max_periods_per_day=constraints_data.get('max_periods_per_day', 8),
            max_consecutive_periods=constraints_data.get('max_consecutive_periods', 3),
            avoid_back_to_back_subjects=constraints_data.get('avoid_back_to_back_subjects', True),
            max_teacher_periods_per_day=constraints_data.get('max_teacher_periods_per_day', 6),
            max_teacher_periods_per_week=constraints_data.get('max_teacher_periods_per_week', 25),
            lunch_break_required=constraints_data.get('lunch_break_required', True),
            min_free_periods_per_teacher=constraints_data.get('min_free_periods_per_teacher', 2),
        )
        
        # Generation parameters
        population_size = data.get('population_size', 100)
        generations = data.get('generations', 1000)
        mutation_rate = data.get('mutation_rate', 0.1)
        crossover_rate = data.get('crossover_rate', 0.8)
        elite_size = data.get('elite_size', 20)
        
        # Validate required data
        if not sections:
            return jsonify({'error': 'sections are required'}), 400
        if not teachers:
            return jsonify({'error': 'teachers are required'}), 400
        if not subjects:
            return jsonify({'error': 'subjects are required'}), 400
        if not school_timing:
            return jsonify({'error': 'school_timing is required'}), 400
        
        logger.info(f"Generating timetable for {len(sections)} sections")
        
        # Create generator
        generator = TimetableGenerator(
            sections=sections,
            teachers=teachers,
            subjects=subjects,
            rooms=rooms,
            school_timing=school_timing,
            break_schedules=break_schedules,
            constraints=constraints
        )
        
        # Generate timetable
        solution = generator.generate(
            population_size=population_size,
            generations=generations,
            mutation_rate=mutation_rate,
            crossover_rate=crossover_rate,
            elite_size=elite_size
        )
        
        # Convert to dict
        result = generator.solution_to_dict(solution)
        
        return jsonify({
            'success': True,
            'timetable': result,
            'generation_params': {
                'population_size': population_size,
                'generations': generations,
                'mutation_rate': mutation_rate,
                'crossover_rate': crossover_rate,
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error in generate_timetable: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@timetable_bp.route('/optimize', methods=['POST'])
@require_auth
def optimize_timetable():
    """Optimize existing timetable"""
    try:
        data = request.json
        
        existing_periods = data.get('periods', [])
        sections = data.get('sections', [])
        teachers = data.get('teachers', [])
        subjects = data.get('subjects', [])
        rooms = data.get('rooms', [])
        school_timing = data.get('school_timing', {})
        break_schedules = data.get('break_schedules', [])
        
        if not existing_periods:
            return jsonify({'error': 'existing periods are required'}), 400
        
        # Convert existing periods to Period objects
        from services.timetable_generation.service import Period
        periods = [
            Period(
                day_of_week=p['day_of_week'],
                period_number=p['period_number'],
                start_time=p['start_time'],
                end_time=p['end_time'],
                subject_id=p['subject_id'],
                teacher_id=p.get('teacher_id'),
                room_id=p.get('room_id'),
                section_id=p['section_id']
            )
            for p in existing_periods
        ]
        
        # Create generator
        constraints_data = data.get('constraints', {})
        constraints = Constraint(
            max_periods_per_day=constraints_data.get('max_periods_per_day', 8),
            max_consecutive_periods=constraints_data.get('max_consecutive_periods', 3),
            avoid_back_to_back_subjects=constraints_data.get('avoid_back_to_back_subjects', True),
            max_teacher_periods_per_day=constraints_data.get('max_teacher_periods_per_day', 6),
            max_teacher_periods_per_week=constraints_data.get('max_teacher_periods_per_week', 25),
        )
        
        generator = TimetableGenerator(
            sections=sections,
            teachers=teachers,
            subjects=subjects,
            rooms=rooms,
            school_timing=school_timing,
            break_schedules=break_schedules,
            constraints=constraints
        )
        
        # Start with existing solution
        from services.timetable_generation.service import TimetableSolution
        initial_solution = TimetableSolution(periods=periods)
        initial_solution.fitness_score = generator._calculate_fitness(initial_solution)
        
        # Run optimization (fewer generations for optimization)
        solution = generator.generate(
            population_size=50,
            generations=500,
            mutation_rate=0.15,
            crossover_rate=0.8,
            elite_size=10
        )
        
        result = generator.solution_to_dict(solution)
        
        return jsonify({
            'success': True,
            'optimized_timetable': result,
            'improvement': {
                'initial_fitness': initial_solution.fitness_score,
                'final_fitness': solution.fitness_score,
                'initial_conflicts': len(initial_solution.conflicts),
                'final_conflicts': len(solution.conflicts),
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error in optimize_timetable: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@timetable_bp.route('/analyze', methods=['POST'])
@require_auth
def analyze_timetable():
    """Analyze timetable for conflicts and quality metrics"""
    try:
        data = request.json
        
        periods = data.get('periods', [])
        sections = data.get('sections', [])
        teachers = data.get('teachers', [])
        subjects = data.get('subjects', [])
        rooms = data.get('rooms', [])
        school_timing = data.get('school_timing', {})
        break_schedules = data.get('break_schedules', [])
        
        if not periods:
            return jsonify({'error': 'periods are required'}), 400
        
        # Convert to Period objects
        from services.timetable_generation.service import Period, TimetableSolution
        period_objects = [
            Period(
                day_of_week=p['day_of_week'],
                period_number=p['period_number'],
                start_time=p['start_time'],
                end_time=p['end_time'],
                subject_id=p['subject_id'],
                teacher_id=p.get('teacher_id'),
                room_id=p.get('room_id'),
                section_id=p['section_id']
            )
            for p in periods
        ]
        
        solution = TimetableSolution(periods=period_objects)
        
        # Create generator for analysis
        constraints_data = data.get('constraints', {})
        constraints = Constraint(
            max_periods_per_day=constraints_data.get('max_periods_per_day', 8),
            max_consecutive_periods=constraints_data.get('max_consecutive_periods', 3),
            avoid_back_to_back_subjects=constraints_data.get('avoid_back_to_back_subjects', True),
            max_teacher_periods_per_day=constraints_data.get('max_teacher_periods_per_day', 6),
            max_teacher_periods_per_week=constraints_data.get('max_teacher_periods_per_week', 25),
        )
        
        generator = TimetableGenerator(
            sections=sections,
            teachers=teachers,
            subjects=subjects,
            rooms=rooms,
            school_timing=school_timing,
            break_schedules=break_schedules,
            constraints=constraints
        )
        
        # Calculate fitness and detect conflicts
        solution.fitness_score = generator._calculate_fitness(solution)
        
        # Calculate additional metrics
        distribution_score = generator._calculate_distribution_score(solution)
        balance_score = generator._calculate_workload_balance(solution)
        
        # Group conflicts by type
        conflicts_by_type = {}
        for conflict in solution.conflicts:
            conflict_type = conflict.get('type', 'unknown')
            if conflict_type not in conflicts_by_type:
                conflicts_by_type[conflict_type] = []
            conflicts_by_type[conflict_type].append(conflict)
        
        return jsonify({
            'success': True,
            'analysis': {
                'fitness_score': solution.fitness_score,
                'distribution_score': distribution_score,
                'workload_balance_score': balance_score,
                'total_conflicts': len(solution.conflicts),
                'conflicts_by_type': {k: len(v) for k, v in conflicts_by_type.items()},
                'conflicts': solution.conflicts,
                'statistics': {
                    'total_periods': len(solution.periods),
                    'total_sections': len(set(p.section_id for p in solution.periods)),
                    'total_teachers': len(set(p.teacher_id for p in solution.periods if p.teacher_id)),
                    'total_rooms': len(set(p.room_id for p in solution.periods if p.room_id)),
                }
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error in analyze_timetable: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500
