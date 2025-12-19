import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 시드 데이터 삽입을 시작합니다...');

  // ========================================
  // 1. 과목 (Subjects)
  // ========================================
  console.log('📚 과목 생성 중...');
  const subjects = await Promise.all([
    prisma.subject.upsert({
      where: { name: 'KOREAN' },
      update: {},
      create: { name: 'KOREAN', displayName: '국어', iconName: 'book-open', color: '#ef4444' },
    }),
    prisma.subject.upsert({
      where: { name: 'ENGLISH' },
      update: {},
      create: { name: 'ENGLISH', displayName: '영어', iconName: 'globe', color: '#3b82f6' },
    }),
    prisma.subject.upsert({
      where: { name: 'MATH' },
      update: {},
      create: { name: 'MATH', displayName: '수학', iconName: 'calculator', color: '#8b5cf6' },
    }),
    prisma.subject.upsert({
      where: { name: 'SCIENCE' },
      update: {},
      create: { name: 'SCIENCE', displayName: '과학', iconName: 'flask-conical', color: '#10b981' },
    }),
    prisma.subject.upsert({
      where: { name: 'SOCIAL' },
      update: {},
      create: { name: 'SOCIAL', displayName: '사회', iconName: 'landmark', color: '#f59e0b' },
    }),
    prisma.subject.upsert({
      where: { name: 'HISTORY' },
      update: {},
      create: { name: 'HISTORY', displayName: '역사', iconName: 'scroll', color: '#6366f1' },
    }),
  ]);

  // ========================================
  // 2. 구독 플랜 (Plans)
  // ========================================
  console.log('💳 구독 플랜 생성 중...');
  const freePlan = await prisma.plan.upsert({
    where: { name: 'FREE' },
    update: {},
    create: {
      name: 'FREE',
      displayName: '무료',
      description: '기본 학습 기능을 무료로 사용해보세요',
      price: 0,
      yearlyPrice: 0,
      features: JSON.stringify([
        '기본 강의 시청',
        '일일 AI 질문 5회',
        '기본 문제 풀이',
        '학습 진도 확인',
      ]),
      aiQuestionsPerDay: 5,
      problemsPerDay: 10,
      hasAnalytics: false,
      hasAITutor: false,
      order: 0,
    },
  });

  const premiumBasic = await prisma.plan.upsert({
    where: { name: 'PREMIUM_BASIC' },
    update: {},
    create: {
      name: 'PREMIUM_BASIC',
      displayName: '프리미엄 베이직',
      description: 'AI 튜터와 함께하는 맞춤 학습',
      price: 29900,
      yearlyPrice: 299000,
      features: JSON.stringify([
        '모든 강의 무제한 시청',
        '일일 AI 질문 무제한',
        'AI 튜터 기본 기능',
        '학습 분석 리포트',
        '맞춤형 문제 추천',
      ]),
      aiQuestionsPerDay: 999,
      problemsPerDay: 999,
      hasAnalytics: true,
      hasAITutor: true,
      order: 1,
    },
  });

  const premiumPlus = await prisma.plan.upsert({
    where: { name: 'PREMIUM_PLUS' },
    update: {},
    create: {
      name: 'PREMIUM_PLUS',
      displayName: '프리미엄 플러스',
      description: '완벽한 학습 지원 시스템',
      price: 49900,
      yearlyPrice: 499000,
      features: JSON.stringify([
        '프리미엄 베이직의 모든 기능',
        '실시간 AI 튜터 개입',
        '수능 예측 분석',
        '학부모 실시간 리포트',
        '1:1 전문가 상담 (월 1회)',
        '오답 노트 자동 생성',
      ]),
      aiQuestionsPerDay: 999,
      problemsPerDay: 999,
      hasAnalytics: true,
      hasAITutor: true,
      order: 2,
    },
  });

  // ========================================
  // 3. 사용자 계정 (Users)
  // ========================================
  console.log('👤 사용자 계정 생성 중...');
  const hashedPassword = await hash('password123', 12);

  // 관리자
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@test.com',
      name: '관리자',
      password: hashedPassword,
      role: 'ADMIN',
      referralCode: 'ADMIN001',
    },
  });

  // 교사 계정들
  const teacher1 = await prisma.user.upsert({
    where: { email: 'teacher@test.com' },
    update: { password: hashedPassword },
    create: {
      email: 'teacher@test.com',
      name: '김선생',
      password: hashedPassword,
      role: 'TEACHER',
      referralCode: 'TEACH001',
    },
  });

  const teacher2 = await prisma.user.upsert({
    where: { email: 'teacher2@jalearn.com' },
    update: { password: hashedPassword },
    create: {
      email: 'teacher2@jalearn.com',
      name: '이영희 선생님',
      password: hashedPassword,
      role: 'TEACHER',
      referralCode: 'TEACH002',
    },
  });

  const teacher3 = await prisma.user.upsert({
    where: { email: 'math.teacher@jalearn.com' },
    update: { password: hashedPassword },
    create: {
      email: 'math.teacher@jalearn.com',
      name: '박수학 선생님',
      password: hashedPassword,
      role: 'TEACHER',
      referralCode: 'TEACH003',
    },
  });

  // 학부모 계정들
  const parent1 = await prisma.user.upsert({
    where: { email: 'parent@test.com' },
    update: { password: hashedPassword },
    create: {
      email: 'parent@test.com',
      name: '학부모',
      password: hashedPassword,
      role: 'PARENT',
      referralCode: 'PRNT001',
    },
  });

  const parent2 = await prisma.user.upsert({
    where: { email: 'parent2@jalearn.com' },
    update: { password: hashedPassword },
    create: {
      email: 'parent2@jalearn.com',
      name: '정미영 학부모',
      password: hashedPassword,
      role: 'PARENT',
      referralCode: 'PRNT002',
    },
  });

  // 학생 계정들
  const student1 = await prisma.user.upsert({
    where: { email: 'student@test.com' },
    update: { password: hashedPassword },
    create: {
      email: 'student@test.com',
      name: '홍길동',
      password: hashedPassword,
      role: 'STUDENT',
      gradeLevel: 'HIGH_2',
      referralCode: 'STD001',
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: 'student2@jalearn.com' },
    update: { password: hashedPassword },
    create: {
      email: 'student2@jalearn.com',
      name: '김민수',
      password: hashedPassword,
      role: 'STUDENT',
      gradeLevel: 'MIDDLE_3',
      referralCode: 'STD002',
    },
  });

  const student3 = await prisma.user.upsert({
    where: { email: 'student3@jalearn.com' },
    update: { password: hashedPassword },
    create: {
      email: 'student3@jalearn.com',
      name: '이지은',
      password: hashedPassword,
      role: 'STUDENT',
      gradeLevel: 'HIGH_1',
      referralCode: 'STD003',
    },
  });

  const student4 = await prisma.user.upsert({
    where: { email: 'student4@jalearn.com' },
    update: { password: hashedPassword },
    create: {
      email: 'student4@jalearn.com',
      name: '박준영',
      password: hashedPassword,
      role: 'STUDENT',
      gradeLevel: 'ELEMENTARY_5',
      referralCode: 'STD004',
    },
  });

  const student5 = await prisma.user.upsert({
    where: { email: 'student5@jalearn.com' },
    update: { password: hashedPassword },
    create: {
      email: 'student5@jalearn.com',
      name: '최서연',
      password: hashedPassword,
      role: 'STUDENT',
      gradeLevel: 'HIGH_3',
      referralCode: 'STD005',
    },
  });

  // ========================================
  // 4. 프로필 (Profiles)
  // ========================================
  console.log('📋 프로필 생성 중...');
  await Promise.all([
    prisma.profile.upsert({
      where: { userId: student1.id },
      update: {},
      create: {
        userId: student1.id,
        school: '서울고등학교',
        birthDate: new Date('2007-03-15'),
        phoneNumber: '010-1234-5678',
        parentConsent: true,
        consentDate: new Date(),
      },
    }),
    prisma.profile.upsert({
      where: { userId: student2.id },
      update: {},
      create: {
        userId: student2.id,
        school: '한강중학교',
        birthDate: new Date('2009-07-22'),
        phoneNumber: '010-2345-6789',
        parentConsent: true,
        consentDate: new Date(),
      },
    }),
    prisma.profile.upsert({
      where: { userId: student3.id },
      update: {},
      create: {
        userId: student3.id,
        school: '강남고등학교',
        birthDate: new Date('2008-11-08'),
        phoneNumber: '010-3456-7890',
        parentConsent: true,
        consentDate: new Date(),
      },
    }),
    prisma.profile.upsert({
      where: { userId: teacher1.id },
      update: {},
      create: {
        userId: teacher1.id,
        bio: '10년차 국어 전문 강사입니다. 수능 국어 만점을 목표로 함께 공부해요!',
        phoneNumber: '010-9876-5432',
      },
    }),
  ]);

  // ========================================
  // 5. 부모-자녀 관계 (ParentChild)
  // ========================================
  console.log('👨‍👩‍👧 부모-자녀 관계 생성 중...');
  await prisma.parentChild.upsert({
    where: { parentId_childId: { parentId: parent1.id, childId: student1.id } },
    update: {},
    create: { parentId: parent1.id, childId: student1.id },
  });
  await prisma.parentChild.upsert({
    where: { parentId_childId: { parentId: parent2.id, childId: student2.id } },
    update: {},
    create: { parentId: parent2.id, childId: student2.id },
  });

  // ========================================
  // 6. 교사-학생 관계 (StudentTeacher)
  // ========================================
  console.log('👨‍🏫 교사-학생 관계 생성 중...');
  await Promise.all([
    prisma.studentTeacher.upsert({
      where: { studentId_teacherId: { studentId: student1.id, teacherId: teacher1.id } },
      update: {},
      create: { studentId: student1.id, teacherId: teacher1.id },
    }),
    prisma.studentTeacher.upsert({
      where: { studentId_teacherId: { studentId: student2.id, teacherId: teacher1.id } },
      update: {},
      create: { studentId: student2.id, teacherId: teacher1.id },
    }),
    prisma.studentTeacher.upsert({
      where: { studentId_teacherId: { studentId: student3.id, teacherId: teacher3.id } },
      update: {},
      create: { studentId: student3.id, teacherId: teacher3.id },
    }),
  ]);

  // ========================================
  // 7. 강좌 (Courses)
  // ========================================
  console.log('🎓 강좌 생성 중...');
  const mathSubject = subjects.find(s => s.name === 'MATH')!;
  const koreanSubject = subjects.find(s => s.name === 'KOREAN')!;
  const englishSubject = subjects.find(s => s.name === 'ENGLISH')!;
  const scienceSubject = subjects.find(s => s.name === 'SCIENCE')!;

  const course1 = await prisma.course.upsert({
    where: { id: 'course-math-high2' },
    update: {},
    create: {
      id: 'course-math-high2',
      title: '수학 II - 미적분 완전정복',
      description: '미분과 적분의 기초부터 심화까지 체계적으로 학습합니다. 수능 수학 고득점을 위한 필수 강좌!',
      subjectId: mathSubject.id,
      gradeLevel: 'HIGH_2',
      isPublished: true,
      creatorId: teacher3.id,
    },
  });

  const course2 = await prisma.course.upsert({
    where: { id: 'course-korean-high' },
    update: {},
    create: {
      id: 'course-korean-high',
      title: '수능 국어 비문학 독해법',
      description: '비문학 지문을 빠르고 정확하게 읽는 방법을 알려드립니다. 매일 꾸준히 연습하세요!',
      subjectId: koreanSubject.id,
      gradeLevel: 'HIGH_3',
      isPublished: true,
      creatorId: teacher1.id,
    },
  });

  const course3 = await prisma.course.upsert({
    where: { id: 'course-english-middle' },
    update: {},
    create: {
      id: 'course-english-middle',
      title: '중학 영문법 완성',
      description: '중학교 필수 영문법을 완벽하게 정리합니다. 고등학교 영어의 기초를 탄탄하게!',
      subjectId: englishSubject.id,
      gradeLevel: 'MIDDLE_3',
      isPublished: true,
      creatorId: teacher2.id,
    },
  });

  const course4 = await prisma.course.upsert({
    where: { id: 'course-science-elem' },
    update: {},
    create: {
      id: 'course-science-elem',
      title: '신나는 초등 과학 탐험',
      description: '재미있는 실험과 함께 과학의 원리를 배워요! 호기심 가득한 과학 여행을 시작해볼까요?',
      subjectId: scienceSubject.id,
      gradeLevel: 'ELEMENTARY_5',
      isPublished: true,
      creatorId: teacher2.id,
    },
  });

  const course5 = await prisma.course.upsert({
    where: { id: 'course-math-probability' },
    update: {},
    create: {
      id: 'course-math-probability',
      title: '확률과 통계 마스터',
      description: '확률과 통계의 핵심 개념과 문제 풀이 전략을 완벽하게 익힙니다.',
      subjectId: mathSubject.id,
      gradeLevel: 'HIGH_3',
      isPublished: true,
      creatorId: teacher3.id,
    },
  });

  // ========================================
  // 8. 강의 (Lessons)
  // ========================================
  console.log('📝 강의 생성 중...');
  const lessons = await Promise.all([
    // 수학 II 강좌의 레슨들
    prisma.lesson.upsert({
      where: { id: 'lesson-math1-1' },
      update: {},
      create: {
        id: 'lesson-math1-1',
        title: '함수의 극한 개념',
        description: '함수의 극한의 정의와 기본 성질을 학습합니다.',
        order: 1,
        videoDuration: 2400,
        courseId: course1.id,
        creatorId: teacher3.id,
        isPublished: true,
      },
    }),
    prisma.lesson.upsert({
      where: { id: 'lesson-math1-2' },
      update: {},
      create: {
        id: 'lesson-math1-2',
        title: '미분의 정의와 공식',
        description: '도함수의 정의부터 기본 미분 공식까지 배웁니다.',
        order: 2,
        videoDuration: 3000,
        courseId: course1.id,
        creatorId: teacher3.id,
        isPublished: true,
      },
    }),
    prisma.lesson.upsert({
      where: { id: 'lesson-math1-3' },
      update: {},
      create: {
        id: 'lesson-math1-3',
        title: '미분의 활용 - 접선과 극값',
        description: '미분을 활용하여 접선의 방정식과 극값을 구합니다.',
        order: 3,
        videoDuration: 2700,
        courseId: course1.id,
        creatorId: teacher3.id,
        isPublished: true,
      },
    }),
    prisma.lesson.upsert({
      where: { id: 'lesson-math1-4' },
      update: {},
      create: {
        id: 'lesson-math1-4',
        title: '적분의 기초',
        description: '부정적분과 정적분의 개념을 이해합니다.',
        order: 4,
        videoDuration: 2800,
        courseId: course1.id,
        creatorId: teacher3.id,
        isPublished: true,
      },
    }),
    // 국어 강좌의 레슨들
    prisma.lesson.upsert({
      where: { id: 'lesson-korean1-1' },
      update: {},
      create: {
        id: 'lesson-korean1-1',
        title: '비문학 구조 파악하기',
        description: '비문학 지문의 기본 구조와 논리적 흐름을 이해합니다.',
        order: 1,
        videoDuration: 2100,
        courseId: course2.id,
        creatorId: teacher1.id,
        isPublished: true,
      },
    }),
    prisma.lesson.upsert({
      where: { id: 'lesson-korean1-2' },
      update: {},
      create: {
        id: 'lesson-korean1-2',
        title: '핵심 정보 빠르게 찾기',
        description: '시간 내에 핵심 정보를 파악하는 스킬을 배웁니다.',
        order: 2,
        videoDuration: 1800,
        courseId: course2.id,
        creatorId: teacher1.id,
        isPublished: true,
      },
    }),
    prisma.lesson.upsert({
      where: { id: 'lesson-korean1-3' },
      update: {},
      create: {
        id: 'lesson-korean1-3',
        title: '추론 문제 공략법',
        description: '비문학 추론 문제를 풀기 위한 전략을 학습합니다.',
        order: 3,
        videoDuration: 2400,
        courseId: course2.id,
        creatorId: teacher1.id,
        isPublished: true,
      },
    }),
    // 영어 강좌의 레슨들
    prisma.lesson.upsert({
      where: { id: 'lesson-english1-1' },
      update: {},
      create: {
        id: 'lesson-english1-1',
        title: '시제의 이해',
        description: '현재, 과거, 미래 시제와 완료형을 정리합니다.',
        order: 1,
        videoDuration: 2200,
        courseId: course3.id,
        creatorId: teacher2.id,
        isPublished: true,
      },
    }),
    prisma.lesson.upsert({
      where: { id: 'lesson-english1-2' },
      update: {},
      create: {
        id: 'lesson-english1-2',
        title: '조동사 완벽정리',
        description: 'can, will, must, should 등 조동사의 쓰임을 익힙니다.',
        order: 2,
        videoDuration: 1900,
        courseId: course3.id,
        creatorId: teacher2.id,
        isPublished: true,
      },
    }),
  ]);

  // ========================================
  // 9. 문제 (Questions)
  // ========================================
  console.log('❓ 문제 생성 중...');
  await Promise.all([
    // 수학 문제
    prisma.question.upsert({
      where: { id: 'q-math-1' },
      update: {},
      create: {
        id: 'q-math-1',
        lessonId: 'lesson-math1-1',
        type: 'MULTIPLE_CHOICE',
        content: 'lim(x→2) (x² - 4) / (x - 2) 의 값은?',
        options: JSON.stringify(['2', '4', '6', '8']),
        answer: '4',
        explanation: 'x² - 4 = (x+2)(x-2)이므로 약분하면 lim(x→2)(x+2) = 4',
        difficulty: 'EASY',
        points: 10,
        order: 1,
      },
    }),
    prisma.question.upsert({
      where: { id: 'q-math-2' },
      update: {},
      create: {
        id: 'q-math-2',
        lessonId: 'lesson-math1-2',
        type: 'MULTIPLE_CHOICE',
        content: 'f(x) = 3x² + 2x - 1 일 때, f\'(2)의 값은?',
        options: JSON.stringify(['10', '12', '14', '16']),
        answer: '14',
        explanation: 'f\'(x) = 6x + 2, f\'(2) = 12 + 2 = 14',
        difficulty: 'MEDIUM',
        points: 15,
        order: 1,
      },
    }),
    prisma.question.upsert({
      where: { id: 'q-math-3' },
      update: {},
      create: {
        id: 'q-math-3',
        lessonId: 'lesson-math1-3',
        type: 'SHORT_ANSWER',
        content: 'y = x³ - 3x + 2 의 극댓값을 구하시오.',
        options: null,
        answer: '4',
        explanation: 'y\' = 3x² - 3 = 0에서 x = ±1. x = -1일 때 극댓값 = 1 + 3 + 2 = 4',
        difficulty: 'HARD',
        points: 20,
        order: 1,
      },
    }),
    // 국어 문제
    prisma.question.upsert({
      where: { id: 'q-korean-1' },
      update: {},
      create: {
        id: 'q-korean-1',
        lessonId: 'lesson-korean1-1',
        type: 'MULTIPLE_CHOICE',
        content: '다음 중 비문학 지문의 구조를 파악할 때 가장 먼저 확인해야 할 것은?',
        options: JSON.stringify(['세부 내용', '글의 주제', '예시', '인용문']),
        answer: '글의 주제',
        explanation: '비문학 독해의 첫 단계는 글의 주제와 중심 내용을 파악하는 것입니다.',
        difficulty: 'EASY',
        points: 10,
        order: 1,
      },
    }),
    // 영어 문제
    prisma.question.upsert({
      where: { id: 'q-english-1' },
      update: {},
      create: {
        id: 'q-english-1',
        lessonId: 'lesson-english1-1',
        type: 'MULTIPLE_CHOICE',
        content: 'She ___ to the library yesterday.',
        options: JSON.stringify(['go', 'goes', 'went', 'going']),
        answer: 'went',
        explanation: 'yesterday는 과거를 나타내므로 과거형 went를 사용합니다.',
        difficulty: 'EASY',
        points: 10,
        order: 1,
      },
    }),
    prisma.question.upsert({
      where: { id: 'q-english-2' },
      update: {},
      create: {
        id: 'q-english-2',
        lessonId: 'lesson-english1-2',
        type: 'MULTIPLE_CHOICE',
        content: 'You ___ finish your homework before watching TV.',
        options: JSON.stringify(['can', 'may', 'should', 'would']),
        answer: 'should',
        explanation: 'should는 의무나 조언을 나타내는 조동사입니다.',
        difficulty: 'MEDIUM',
        points: 15,
        order: 1,
      },
    }),
  ]);

  // ========================================
  // 10. 수강 신청 (Enrollments)
  // ========================================
  console.log('📖 수강 신청 생성 중...');
  await Promise.all([
    prisma.enrollment.upsert({
      where: { userId_courseId: { userId: student1.id, courseId: course1.id } },
      update: {},
      create: { userId: student1.id, courseId: course1.id },
    }),
    prisma.enrollment.upsert({
      where: { userId_courseId: { userId: student1.id, courseId: course2.id } },
      update: {},
      create: { userId: student1.id, courseId: course2.id },
    }),
    prisma.enrollment.upsert({
      where: { userId_courseId: { userId: student2.id, courseId: course3.id } },
      update: {},
      create: { userId: student2.id, courseId: course3.id },
    }),
    prisma.enrollment.upsert({
      where: { userId_courseId: { userId: student3.id, courseId: course1.id } },
      update: {},
      create: { userId: student3.id, courseId: course1.id },
    }),
    prisma.enrollment.upsert({
      where: { userId_courseId: { userId: student4.id, courseId: course4.id } },
      update: {},
      create: { userId: student4.id, courseId: course4.id },
    }),
    prisma.enrollment.upsert({
      where: { userId_courseId: { userId: student5.id, courseId: course5.id } },
      update: {},
      create: { userId: student5.id, courseId: course5.id },
    }),
  ]);

  // ========================================
  // 11. 학습 진도 (Progress)
  // ========================================
  console.log('📊 학습 진도 생성 중...');
  await Promise.all([
    prisma.progress.upsert({
      where: { userId_lessonId: { userId: student1.id, lessonId: 'lesson-math1-1' } },
      update: {},
      create: {
        userId: student1.id,
        lessonId: 'lesson-math1-1',
        watchedDuration: 2400,
        isCompleted: true,
        lastPosition: 2400,
        completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.progress.upsert({
      where: { userId_lessonId: { userId: student1.id, lessonId: 'lesson-math1-2' } },
      update: {},
      create: {
        userId: student1.id,
        lessonId: 'lesson-math1-2',
        watchedDuration: 1500,
        isCompleted: false,
        lastPosition: 1500,
      },
    }),
    prisma.progress.upsert({
      where: { userId_lessonId: { userId: student2.id, lessonId: 'lesson-english1-1' } },
      update: {},
      create: {
        userId: student2.id,
        lessonId: 'lesson-english1-1',
        watchedDuration: 2200,
        isCompleted: true,
        lastPosition: 2200,
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  // ========================================
  // 12. 구독 (Subscriptions)
  // ========================================
  console.log('💳 구독 생성 중...');
  await Promise.all([
    prisma.subscription.upsert({
      where: { id: 'sub-student1' },
      update: {},
      create: {
        id: 'sub-student1',
        userId: student1.id,
        planId: premiumPlus.id,
        status: 'ACTIVE',
        billingCycle: 'MONTHLY',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.subscription.upsert({
      where: { id: 'sub-student2' },
      update: {},
      create: {
        id: 'sub-student2',
        userId: student2.id,
        planId: premiumBasic.id,
        status: 'ACTIVE',
        billingCycle: 'YEARLY',
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        nextBillingDate: new Date(Date.now() + 305 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.subscription.upsert({
      where: { id: 'sub-student3' },
      update: {},
      create: {
        id: 'sub-student3',
        userId: student3.id,
        planId: freePlan.id,
        status: 'ACTIVE',
        billingCycle: 'MONTHLY',
      },
    }),
  ]);

  // ========================================
  // 13. 알림 (Notifications)
  // ========================================
  console.log('🔔 알림 생성 중...');
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: student1.id,
        type: 'STUDY_REMINDER',
        title: '학습 알림',
        message: '오늘 수학 II 강좌 학습을 시작해보세요! 미분 강의가 기다리고 있어요.',
        link: '/courses/course-math-high2',
      },
    }),
    prisma.notification.create({
      data: {
        userId: student1.id,
        type: 'ACHIEVEMENT',
        title: '🎉 축하합니다!',
        message: '7일 연속 학습 달성! 꾸준한 학습이 성적 향상의 비결입니다.',
      },
    }),
    prisma.notification.create({
      data: {
        userId: parent1.id,
        type: 'PROGRESS_UPDATE',
        title: '자녀 학습 리포트',
        message: '홍길동 학생이 이번 주 10시간 학습을 완료했습니다.',
        link: '/parent/reports',
      },
    }),
  ]);

  // ========================================
  // 14. 쿠폰 (Coupons)
  // ========================================
  console.log('🎁 쿠폰 생성 중...');
  const coupon1 = await prisma.coupon.upsert({
    where: { code: 'WELCOME2024' },
    update: {},
    create: {
      code: 'WELCOME2024',
      name: '신규 가입 환영 쿠폰',
      description: '첫 결제 시 30% 할인',
      discountType: 'PERCENT',
      discountValue: 30,
      maxDiscountAmount: 15000,
      maxUses: 1000,
      maxUsesPerUser: 1,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'NEWYEAR10' },
    update: {},
    create: {
      code: 'NEWYEAR10',
      name: '새해 맞이 할인',
      description: '10,000원 할인 쿠폰',
      discountType: 'FIXED_AMOUNT',
      discountValue: 10000,
      maxUses: 500,
      maxUsesPerUser: 1,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  // ========================================
  // 15. AI 튜터 세션 (AITutorSession)
  // ========================================
  console.log('🤖 AI 튜터 세션 생성 중...');
  const tutorSession = await prisma.aITutorSession.create({
    data: {
      userId: student1.id,
      planType: 'ELITE',
      topic: '미적분 기초',
      subject: '수학',
      gradeLevel: 'HIGH_2',
      durationMins: 45,
      tokensUsed: 12500,
      messagesCount: 32,
      status: 'COMPLETED',
      rating: 5,
      feedback: '선생님처럼 친절하게 설명해주셔서 이해가 잘 됐어요!',
      endTime: new Date(),
    },
  });

  // 튜터 메시지들
  await Promise.all([
    prisma.tutorMessage.create({
      data: {
        sessionId: tutorSession.id,
        role: 'USER',
        content: '미분이 정확히 뭔가요? 함수의 기울기라고 하는데 잘 이해가 안 돼요.',
        tokensUsed: 50,
      },
    }),
    prisma.tutorMessage.create({
      data: {
        sessionId: tutorSession.id,
        role: 'TUTOR',
        content: '좋은 질문이에요! 미분은 함수의 순간적인 변화율을 의미해요. 자동차로 예를 들어볼게요. 속도계에 표시되는 속도가 바로 그 순간의 미분값이에요. 위치가 시간에 따라 얼마나 빠르게 변하는지를 나타내죠.',
        tokensUsed: 150,
      },
    }),
    prisma.tutorMessage.create({
      data: {
        sessionId: tutorSession.id,
        role: 'USER',
        content: '아! 그러면 접선의 기울기랑 같은 건가요?',
        tokensUsed: 30,
      },
    }),
    prisma.tutorMessage.create({
      data: {
        sessionId: tutorSession.id,
        role: 'TUTOR',
        content: '정확해요! 👏 곡선 위의 한 점에서 그 곡선에 딱 붙어 있는 직선을 접선이라고 하는데, 그 접선의 기울기가 바로 그 점에서의 미분값이에요. 이제 실제 문제를 풀어볼까요?',
        tokensUsed: 120,
      },
    }),
  ]);

  // ========================================
  // 16. 튜터 메모리 (TutorMemory)
  // ========================================
  console.log('🧠 튜터 메모리 생성 중...');
  await prisma.tutorMemory.upsert({
    where: { userId: student1.id },
    update: {},
    create: {
      userId: student1.id,
      shortTerm: JSON.stringify({
        lastTopic: '미적분',
        lastSession: new Date().toISOString(),
        recentQuestions: ['미분 정의', '접선의 기울기'],
      }),
      longTerm: JSON.stringify({
        totalSessions: 15,
        favoriteSubjects: ['수학', '과학'],
        masteredTopics: ['함수의 극한', '기초 미분'],
      }),
      preferences: JSON.stringify({
        explanationStyle: 'visual',
        pacePreference: 'moderate',
        encouragementLevel: 'high',
      }),
      strengths: JSON.stringify(['논리적 사고', '계산 능력']),
      weaknesses: JSON.stringify(['응용 문제', '긴 지문 이해']),
      learningStyle: 'VISUAL',
      lastTopics: JSON.stringify(['함수의 극한', '미분의 정의', '접선의 방정식']),
    },
  });

  // ========================================
  // 17. 시험 목표 (ExamGoal)
  // ========================================
  console.log('🎯 시험 목표 생성 중...');
  const examGoal = await prisma.examGoal.create({
    data: {
      userId: student5.id,
      examType: 'SUNEUNG',
      examName: '2025학년도 대학수학능력시험',
      targetDate: new Date('2025-11-13'),
      targetScore: 95,
      currentScore: 82,
      subjects: JSON.stringify(['국어', '수학', '영어', '탐구']),
      strategies: JSON.stringify({
        weak: ['미적분 응용', '비문학 추론'],
        focus: ['매일 수학 2시간', '주말 모의고사'],
      }),
      status: 'ACTIVE',
    },
  });

  await prisma.examPrediction.create({
    data: {
      goalId: examGoal.id,
      predictedScore: 88,
      confidence: 0.72,
      basedOn: JSON.stringify({
        recentScores: [80, 82, 85],
        studyHistory: '주 25시간 학습',
        improvements: '수학 10% 상승',
      }),
      recommendations: JSON.stringify([
        '미적분 심화 문제 풀이 증가',
        '실전 모의고사 주 1회 실시',
        '오답 노트 정리 습관화',
      ]),
    },
  });

  // ========================================
  // 18. 학부모 리포트 (ParentReport)
  // ========================================
  console.log('📈 학부모 리포트 생성 중...');
  await prisma.parentReport.create({
    data: {
      parentId: parent1.id,
      childId: student1.id,
      reportType: 'WEEKLY',
      period: '2024-W50',
      studyTime: 720, // 12시간
      completedLessons: 5,
      quizScores: JSON.stringify([85, 90, 78, 92, 88]),
      aiInteractions: 23,
      strengths: JSON.stringify(['미적분 기초', '문제 이해력']),
      improvements: JSON.stringify(['적분 응용 문제', '시간 관리']),
      aiComment: '홍길동 학생은 이번 주 미적분 단원에서 눈에 띄는 성장을 보였습니다. 특히 도함수의 정의와 기본 미분법을 잘 이해하고 있습니다. 다음 주에는 적분으로 넘어가기 전에 미분의 응용 문제를 더 연습하면 좋겠습니다.',
    },
  });

  // ========================================
  // 19. 학부모 알림 (ParentAlert)
  // ========================================
  console.log('⚠️ 학부모 알림 생성 중...');
  await prisma.parentAlert.create({
    data: {
      parentId: parent1.id,
      childId: student1.id,
      alertType: 'ACHIEVEMENT',
      severity: 'INFO',
      title: '🏆 학습 목표 달성!',
      message: '홍길동 학생이 이번 주 학습 목표를 100% 달성했습니다!',
      actionUrl: '/parent/reports',
    },
  });

  // ========================================
  // 20. 강사 프로필 (InstructorProfile)
  // ========================================
  console.log('👨‍🏫 강사 프로필 생성 중...');
  await Promise.all([
    prisma.instructorProfile.upsert({
      where: { userId: teacher1.id },
      update: {},
      create: {
        userId: teacher1.id,
        displayName: '김선생의 국어교실',
        bio: '서울대학교 국어국문학과 졸업 후 현직 고등학교 국어 교사로 10년간 재직 중입니다. 수능 국어 만점자 다수 배출!',
        specialties: JSON.stringify(['수능 국어', '비문학', '문학']),
        qualifications: JSON.stringify([
          '서울대학교 국어국문학과 졸업',
          '정교사 2급 자격증',
          'EBS 국어 강사 경력',
        ]),
        isVerified: true,
        verifiedAt: new Date(),
        status: 'APPROVED',
        rating: 4.9,
        totalStudents: 1523,
        totalEarnings: 45600000,
      },
    }),
    prisma.instructorProfile.upsert({
      where: { userId: teacher3.id },
      update: {},
      create: {
        userId: teacher3.id,
        displayName: '박수학 선생님',
        bio: 'KAIST 수학과 출신, 수학의 본질을 쉽게 알려드립니다. 매년 수학 1등급 학생 100명 이상 배출!',
        specialties: JSON.stringify(['수학 I', '수학 II', '미적분', '확률과 통계']),
        qualifications: JSON.stringify([
          'KAIST 수학과 석사',
          '수학올림피아드 금메달',
          '전국 수학강사 대상 수상',
        ]),
        isVerified: true,
        verifiedAt: new Date(),
        status: 'APPROVED',
        rating: 4.8,
        totalStudents: 2341,
        totalEarnings: 78900000,
      },
    }),
  ]);

  // ========================================
  // 21. AI 튜터 플랜 (AITutorPlan)
  // ========================================
  console.log('🤖 AI 튜터 플랜 생성 중...');
  await Promise.all([
    prisma.aITutorPlan.upsert({
      where: { name: 'AI_TUTOR_PRO' },
      update: {},
      create: {
        name: 'AI_TUTOR_PRO',
        displayName: 'AI 튜터 프로',
        description: '기본적인 AI 튜터 기능을 무제한으로 사용하세요',
        priceType: 'MONTHLY',
        price: 19900,
        features: JSON.stringify([
          '무제한 AI 질문답변',
          '맞춤형 문제 추천',
          '학습 분석 리포트',
          '오답노트 자동 생성',
        ]),
        maxSessions: null,
        hasRealTimeIntervention: false,
        hasExamAnalysis: false,
        hasMemory: true,
        order: 1,
      },
    }),
    prisma.aITutorPlan.upsert({
      where: { name: 'AI_TUTOR_ELITE' },
      update: {},
      create: {
        name: 'AI_TUTOR_ELITE',
        displayName: 'AI 튜터 엘리트',
        description: '프리미엄 AI 튜터링 경험을 제공합니다',
        priceType: 'MONTHLY',
        price: 39900,
        features: JSON.stringify([
          'AI 튜터 프로의 모든 기능',
          '실시간 학습 개입',
          '수능 성적 예측',
          '취약점 집중 훈련',
          '학습 스타일 분석',
        ]),
        maxSessions: null,
        hasRealTimeIntervention: true,
        hasExamAnalysis: true,
        hasMemory: true,
        order: 2,
      },
    }),
    prisma.aITutorPlan.upsert({
      where: { name: 'AI_TUTOR_TIME' },
      update: {},
      create: {
        name: 'AI_TUTOR_TIME',
        displayName: 'AI 튜터 타임제',
        description: '사용한 만큼만 결제하세요',
        priceType: 'PER_MINUTE',
        price: 100,
        minuteRate: 100,
        features: JSON.stringify([
          '분당 100원 과금',
          '모든 AI 튜터 기능 사용 가능',
          '사용량 기반 유연한 결제',
        ]),
        maxSessions: null,
        hasRealTimeIntervention: true,
        hasExamAnalysis: true,
        hasMemory: true,
        order: 3,
      },
    }),
  ]);

  // ========================================
  // 22. 사용자 크레딧 (UserCredits)
  // ========================================
  console.log('💰 사용자 크레딧 생성 중...');
  await Promise.all([
    prisma.userCredits.upsert({
      where: { userId: student1.id },
      update: {},
      create: {
        userId: student1.id,
        freeCredits: 5,
        paidCredits: 100,
      },
    }),
    prisma.userCredits.upsert({
      where: { userId: student2.id },
      update: {},
      create: {
        userId: student2.id,
        freeCredits: 10,
        paidCredits: 50,
      },
    }),
    prisma.userCredits.upsert({
      where: { userId: student3.id },
      update: {},
      create: {
        userId: student3.id,
        freeCredits: 5,
        paidCredits: 0,
      },
    }),
  ]);

  // ========================================
  // 23. 학습 분석 (LearningAnalytics)
  // ========================================
  console.log('📊 학습 분석 데이터 생성 중...');
  await Promise.all([
    prisma.learningAnalytics.create({
      data: {
        userId: student1.id,
        subjectId: mathSubject.id,
        weeklyStudyTime: 480,
        correctRate: 0.85,
        weakAreas: JSON.stringify(['적분의 활용', '급수의 수렴']),
        strengths: JSON.stringify(['미분 계산', '극한 개념']),
      },
    }),
    prisma.learningAnalytics.create({
      data: {
        userId: student1.id,
        subjectId: koreanSubject.id,
        weeklyStudyTime: 300,
        correctRate: 0.78,
        weakAreas: JSON.stringify(['비문학 추론', '어휘력']),
        strengths: JSON.stringify(['문학 감상', '핵심 파악']),
      },
    }),
  ]);

  // ========================================
  // 24. 문제 제출 (Submissions)
  // ========================================
  console.log('✅ 문제 제출 기록 생성 중...');
  await Promise.all([
    prisma.submission.create({
      data: {
        userId: student1.id,
        questionId: 'q-math-1',
        answer: '4',
        isCorrect: true,
        earnedPoints: 10,
        timeSpent: 45,
      },
    }),
    prisma.submission.create({
      data: {
        userId: student1.id,
        questionId: 'q-math-2',
        answer: '14',
        isCorrect: true,
        earnedPoints: 15,
        timeSpent: 120,
      },
    }),
    prisma.submission.create({
      data: {
        userId: student1.id,
        questionId: 'q-math-3',
        answer: '4',
        isCorrect: true,
        earnedPoints: 20,
        timeSpent: 180,
      },
    }),
    prisma.submission.create({
      data: {
        userId: student2.id,
        questionId: 'q-english-1',
        answer: 'went',
        isCorrect: true,
        earnedPoints: 10,
        timeSpent: 30,
      },
    }),
  ]);

  console.log('');
  console.log('✅ 시드 데이터 삽입이 완료되었습니다!');
  console.log('');
  console.log('📋 생성된 테스트 계정:');
  console.log('   ┌─────────────────────────────────────────────────────────────┐');
  console.log('   │ 역할        이메일                      비밀번호           │');
  console.log('   ├─────────────────────────────────────────────────────────────┤');
  console.log('   │ 관리자      admin@test.com              password123        │');
  console.log('   │ 교사        teacher@test.com            password123        │');
  console.log('   │ 학부모      parent@test.com             password123        │');
  console.log('   │ 학생        student@test.com            password123        │');
  console.log('   │ 학생        student2@jalearn.com        password123        │');
  console.log('   │ 학생        student3@jalearn.com        password123        │');
  console.log('   └─────────────────────────────────────────────────────────────┘');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ 시드 데이터 삽입 중 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
