import { Grade, Assessment, AssessmentType } from '../../shared/types';
import { NotFoundError } from '../../shared/utils/errors';
import logger from '../../shared/utils/logger';
import sequelize from '../../config/database';
import { publishMessage } from '../../config/rabbitmq';

export class AcademicsService {
  async createAssessment(data: {
    schoolId: string;
    classId: string;
    subject: string;
    title: string;
    type: AssessmentType;
    maxScore: number;
    weight: number;
    dueDate: Date;
    rubric?: any;
  }): Promise<Assessment> {
    const [result] = await sequelize.query(
      `INSERT INTO assessments (id, "schoolId", "classId", subject, title, type, "maxScore", weight, "dueDate", rubric, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), :schoolId, :classId, :subject, :title, :type, :maxScore, :weight, :dueDate, :rubric, NOW(), NOW())
       RETURNING *`,
      {
        replacements: {
          schoolId: data.schoolId,
          classId: data.classId,
          subject: data.subject,
          title: data.title,
          type: data.type,
          maxScore: data.maxScore,
          weight: data.weight,
          dueDate: data.dueDate,
          rubric: data.rubric ? JSON.stringify(data.rubric) : null,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    ) as Assessment[];

    logger.info(`Assessment ${data.title} created`);
    return result;
  }

  async createGrade(data: {
    studentId: string;
    classId: string;
    subject: string;
    assessmentId: string;
    score: number;
    maxScore: number;
    remarks?: string;
    gradedBy: string;
  }): Promise<Grade> {
    const percentage = (data.score / data.maxScore) * 100;
    const grade = this.calculateGrade(percentage);

    const [result] = await sequelize.query(
      `INSERT INTO grades (id, "studentId", "classId", subject, "assessmentId", score, "maxScore", percentage, grade, remarks, "gradedBy", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), :studentId, :classId, :subject, :assessmentId, :score, :maxScore, :percentage, :grade, :remarks, :gradedBy, NOW(), NOW())
       RETURNING *`,
      {
        replacements: {
          studentId: data.studentId,
          classId: data.classId,
          subject: data.subject,
          assessmentId: data.assessmentId,
          score: data.score,
          maxScore: data.maxScore,
          percentage,
          grade,
          remarks: data.remarks || null,
          gradedBy: data.gradedBy,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    ) as Grade[];

    // Publish notification
    await publishMessage('notifications', {
      type: 'grade_added',
      data: result,
      studentId: data.studentId,
    });

    logger.info(`Grade created for student ${data.studentId}`);
    return result;
  }

  async getGradesByStudent(
    studentId: string,
    classId?: string,
    subject?: string
  ): Promise<Grade[]> {
    let query = `SELECT * FROM grades WHERE "studentId" = :studentId`;
    const replacements: any = { studentId };

    if (classId) {
      query += ` AND "classId" = :classId`;
      replacements.classId = classId;
    }

    if (subject) {
      query += ` AND subject = :subject`;
      replacements.subject = subject;
    }

    query += ` ORDER BY "createdAt" DESC`;

    const grades = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    }) as Grade[];

    return grades;
  }

  async getStudentProgress(
    studentId: string,
    classId: string
  ): Promise<{
    overallAverage: number;
    subjectAverages: Record<string, number>;
    totalAssessments: number;
    completedAssessments: number;
  }> {
    const grades = await this.getGradesByStudent(studentId, classId);

    const subjectScores: Record<string, number[]> = {};
    let totalScore = 0;
    let totalMax = 0;

    grades.forEach((grade) => {
      if (!subjectScores[grade.subject]) {
        subjectScores[grade.subject] = [];
      }
      subjectScores[grade.subject].push(grade.percentage);
      totalScore += grade.score;
      totalMax += grade.maxScore;
    });

    const subjectAverages: Record<string, number> = {};
    Object.keys(subjectScores).forEach((subject) => {
      const scores = subjectScores[subject];
      subjectAverages[subject] =
        scores.reduce((a, b) => a + b, 0) / scores.length;
    });

    const overallAverage = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;

    // Get assessments count
    const [assessmentCount] = await sequelize.query(
      `SELECT COUNT(*) as total FROM assessments WHERE "classId" = :classId`,
      {
        replacements: { classId },
        type: sequelize.QueryTypes.SELECT,
      }
    ) as any[];

    return {
      overallAverage: Math.round(overallAverage * 100) / 100,
      subjectAverages,
      totalAssessments: parseInt(assessmentCount?.total || '0'),
      completedAssessments: grades.length,
    };
  }

  private calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'B+';
    if (percentage >= 75) return 'B';
    if (percentage >= 70) return 'C+';
    if (percentage >= 65) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }
}
