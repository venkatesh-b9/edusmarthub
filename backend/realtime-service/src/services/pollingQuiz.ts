import { Server as SocketIOServer, Socket } from 'socket.io';
import { Poll, Quiz, PollResults, QuizSubmission, Message, MessageType } from '../types';
import logger from '../utils/logger';
import { MessagePersistence } from '../utils/messagePersistence';
import { v4 as uuidv4 } from 'uuid';

export class PollingQuizService {
  private io: SocketIOServer;
  private messagePersistence: MessagePersistence;
  private activePolls: Map<string, Poll> = new Map();
  private activeQuizzes: Map<string, Quiz> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.messagePersistence = new MessagePersistence();
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      // Create poll
      socket.on('create_poll', (data: { roomId: string; poll: Omit<Poll, 'id' | 'createdAt' | 'results'> }) => {
        this.createPoll(socket, data);
      });

      // Vote on poll
      socket.on('vote_poll', (data: { pollId: string; optionId: string }) => {
        this.votePoll(socket, data);
      });

      // Get poll results
      socket.on('get_poll_results', (data: { pollId: string }) => {
        this.getPollResults(socket, data);
      });

      // End poll
      socket.on('end_poll', (data: { pollId: string }) => {
        this.endPoll(socket, data);
      });

      // Create quiz
      socket.on('create_quiz', (data: { roomId: string; quiz: Omit<Quiz, 'id' | 'createdAt' | 'submissions'> }) => {
        this.createQuiz(socket, data);
      });

      // Submit quiz answer
      socket.on('submit_quiz_answer', (data: { quizId: string; questionId: string; answer: any }) => {
        this.submitQuizAnswer(socket, data);
      });

      // Submit quiz
      socket.on('submit_quiz', (data: { quizId: string; answers: Record<string, any> }) => {
        this.submitQuiz(socket, data);
      });

      // Get quiz results
      socket.on('get_quiz_results', (data: { quizId: string }) => {
        this.getQuizResults(socket, data);
      });
    });
  }

  private createPoll(socket: Socket, data: { roomId: string; poll: Omit<Poll, 'id' | 'createdAt' | 'results'> }) {
    const poll: Poll = {
      id: uuidv4(),
      roomId: data.roomId,
      question: data.poll.question,
      options: data.poll.options.map((opt) => ({ ...opt, votes: 0 })),
      createdBy: socket.data.userId,
      createdAt: new Date(),
      expiresAt: data.poll.expiresAt,
      isActive: true,
    };

    this.activePolls.set(poll.id, poll);

    // Broadcast poll to room
    this.io.to(data.roomId).emit('poll_created', poll);

    // Persist poll
    const message: Message = {
      id: uuidv4(),
      roomId: data.roomId,
      senderId: socket.data.userId,
      senderName: socket.data.userName || 'Teacher',
      type: MessageType.POLL,
      content: { poll },
      timestamp: new Date(),
    };

    this.messagePersistence.saveMessage(message);

    logger.info(`Poll created: ${poll.id} in room ${data.roomId}`);
  }

  private votePoll(socket: Socket, data: { pollId: string; optionId: string }) {
    const poll = this.activePolls.get(data.pollId);
    if (!poll || !poll.isActive) {
      socket.emit('error', { message: 'Poll not found or inactive' });
      return;
    }

    // Check if user already voted (simplified - would track per user in production)
    const option = poll.options.find((opt) => opt.id === data.optionId);
    if (option) {
      option.votes++;
    }

    // Update results
    if (!poll.results) {
      poll.results = {
        totalVotes: 0,
        options: poll.options,
        participants: [],
      };
    }
    poll.results.totalVotes++;
    poll.results.participants.push(socket.data.userId);

    // Broadcast updated results
    this.io.to(poll.roomId).emit('poll_updated', {
      pollId: poll.id,
      results: poll.results,
    });

    logger.debug(`Vote cast on poll ${data.pollId}`);
  }

  private getPollResults(socket: Socket, data: { pollId: string }) {
    const poll = this.activePolls.get(data.pollId);
    if (!poll) {
      socket.emit('error', { message: 'Poll not found' });
      return;
    }

    socket.emit('poll_results', {
      pollId: poll.id,
      results: poll.results || {
        totalVotes: 0,
        options: poll.options,
        participants: [],
      },
    });
  }

  private endPoll(socket: Socket, data: { pollId: string }) {
    const poll = this.activePolls.get(data.pollId);
    if (!poll) {
      socket.emit('error', { message: 'Poll not found' });
      return;
    }

    poll.isActive = false;

    // Broadcast poll ended
    this.io.to(poll.roomId).emit('poll_ended', {
      pollId: poll.id,
      finalResults: poll.results,
    });

    logger.info(`Poll ended: ${data.pollId}`);
  }

  private createQuiz(socket: Socket, data: { roomId: string; quiz: Omit<Quiz, 'id' | 'createdAt' | 'submissions'> }) {
    const quiz: Quiz = {
      id: uuidv4(),
      roomId: data.roomId,
      title: data.quiz.title,
      questions: data.quiz.questions,
      createdBy: socket.data.userId,
      createdAt: new Date(),
      timeLimit: data.quiz.timeLimit,
      isActive: true,
      submissions: [],
    };

    this.activeQuizzes.set(quiz.id, quiz);

    // Broadcast quiz to room
    this.io.to(data.roomId).emit('quiz_created', quiz);

    // Persist quiz
    const message: Message = {
      id: uuidv4(),
      roomId: data.roomId,
      senderId: socket.data.userId,
      senderName: socket.data.userName || 'Teacher',
      type: MessageType.QUIZ,
      content: { quiz },
      timestamp: new Date(),
    };

    this.messagePersistence.saveMessage(message);

    logger.info(`Quiz created: ${quiz.id} in room ${data.roomId}`);
  }

  private submitQuizAnswer(socket: Socket, data: { quizId: string; questionId: string; answer: any }) {
    const quiz = this.activeQuizzes.get(data.quizId);
    if (!quiz || !quiz.isActive) {
      socket.emit('error', { message: 'Quiz not found or inactive' });
      return;
    }

    // Store answer temporarily (would be stored per student in production)
    socket.emit('answer_received', {
      quizId: data.quizId,
      questionId: data.questionId,
    });

    logger.debug(`Answer submitted for quiz ${data.quizId}, question ${data.questionId}`);
  }

  private submitQuiz(socket: Socket, data: { quizId: string; answers: Record<string, any> }) {
    const quiz = this.activeQuizzes.get(data.quizId);
    if (!quiz || !quiz.isActive) {
      socket.emit('error', { message: 'Quiz not found or inactive' });
      return;
    }

    // Calculate score
    let score = 0;
    let totalPoints = 0;

    quiz.questions.forEach((question) => {
      totalPoints += question.points;
      const answer = data.answers[question.id];
      if (answer === question.correctAnswer || 
          (Array.isArray(question.correctAnswer) && question.correctAnswer.includes(answer))) {
        score += question.points;
      }
    });

    const percentage = (score / totalPoints) * 100;

    // Create submission
    const submission: QuizSubmission = {
      studentId: socket.data.userId,
      answers: data.answers,
      submittedAt: new Date(),
      score: percentage,
    };

    quiz.submissions.push(submission);

    // Send results to student
    socket.emit('quiz_submitted', {
      quizId: quiz.id,
      score,
      totalPoints,
      percentage,
    });

    // Notify teacher
    this.io.to(`user:${quiz.createdBy}`).emit('quiz_submission_received', {
      quizId: quiz.id,
      studentId: socket.data.userId,
      studentName: socket.data.userName,
      score,
      percentage,
      submittedAt: submission.submittedAt,
    });

    logger.info(`Quiz submitted: ${quiz.id} by ${socket.data.userId}, score: ${percentage}%`);
  }

  private getQuizResults(socket: Socket, data: { quizId: string }) {
    const quiz = this.activeQuizzes.get(data.quizId);
    if (!quiz) {
      socket.emit('error', { message: 'Quiz not found' });
      return;
    }

    // Only creator can see all results
    if (quiz.createdBy !== socket.data.userId) {
      socket.emit('error', { message: 'Unauthorized' });
      return;
    }

    socket.emit('quiz_results', {
      quizId: quiz.id,
      submissions: quiz.submissions,
      statistics: {
        totalSubmissions: quiz.submissions.length,
        averageScore: quiz.submissions.reduce((sum, s) => sum + (s.score || 0), 0) / quiz.submissions.length,
        highestScore: Math.max(...quiz.submissions.map((s) => s.score || 0)),
        lowestScore: Math.min(...quiz.submissions.map((s) => s.score || 0)),
      },
    });
  }
}
