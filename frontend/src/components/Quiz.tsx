import axios from 'axios';
import { useState, useEffect, useRef } from 'react';


interface Question {
    question: string;
    choices: string[];
    answers: string[];
}

interface QuizData {
    quiz: Question[];
}

const Quiz = () => {
    const [quizData, setQuizData] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(
        parseInt(localStorage.getItem('currentQuestionIndex') ?? '0', 10)
    );
    const [selectedAnswers, setSelectedAnswers] = useState<string[][]>(
        JSON.parse(localStorage.getItem('selectedAnswers') ?? '[]')
    );
    const [quizStarted, setQuizStarted] = useState<boolean>(
        localStorage.getItem('quizStarted') === 'true'
    );
    const [timeLeft, setTimeLeft] = useState<number>(
        parseInt(localStorage.getItem('timeLeft') ?? '600', 10)
    );
    const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
    const [score, setScore] = useState<number | null>(null);
    const [fullscreenEnabled, setFullscreenEnabled] = useState<boolean>(false);

    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get<QuizData>('http://localhost:8000/');
                setQuizData(response.data.quiz);
                setSelectedAnswers(new Array(response.data.quiz.length).fill([]));
            } catch (error) {
                console.error(error);
            }
        };
        fetchData();

        window.addEventListener('beforeunload', handleBeforeUnload);

        if (quizStarted) {
            startTimer();
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [quizStarted]);

    useEffect(() => {
        if (timeLeft <= 0) {
            handleQuizCompletion();
        }
    }, [timeLeft]);

    useEffect(() => {
        localStorage.setItem('currentQuestionIndex', currentQuestionIndex.toString());
        localStorage.setItem('timeLeft', timeLeft.toString());
        localStorage.setItem('quizStarted', quizStarted.toString());
        localStorage.setItem('selectedAnswers', JSON.stringify(selectedAnswers));
    }, [currentQuestionIndex, timeLeft, quizStarted, selectedAnswers]);

    useEffect(() => {
        // Check if full screen is enabled on component mount
        if (document.fullscreenElement) {
            setFullscreenEnabled(true);
        }
    }, []);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Do you really want to leave?';
    };

    const startTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        timerRef.current = window.setInterval(() => {
            setTimeLeft((prevTime) => prevTime - 1);
        }, 1000);
    };

    const handleAnswerSelect = (choice: string) => {
        setSelectedAnswers((prevSelectedAnswers) => {
            const updatedAnswers = [...prevSelectedAnswers];
            if (!updatedAnswers[currentQuestionIndex]) {
                updatedAnswers[currentQuestionIndex] = [];
            }
            if (updatedAnswers[currentQuestionIndex].includes(choice)) {
                updatedAnswers[currentQuestionIndex] = updatedAnswers[currentQuestionIndex].filter(
                    (answer) => answer !== choice
                );
            } else {
                updatedAnswers[currentQuestionIndex] = [
                    ...updatedAnswers[currentQuestionIndex],
                    choice,
                ];
            }
            return updatedAnswers;
        });
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < quizData.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleQuizCompletion = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        calculateScore();
        setQuizStarted(false); // stop the quiz
        localStorage.removeItem('currentQuestionIndex'); // reset question index for a new quiz
        localStorage.removeItem('timeLeft'); // reset time for a new quiz
        setQuizCompleted(true); // set quiz completed to true
    };

    const calculateScore = () => {
        let score = 0;
        quizData.forEach((question, index) => {
            const selectedCorrectAnswers = selectedAnswers[index]?.filter((answer) =>
                question.answers.includes(answer)
            );
            if (
                selectedCorrectAnswers?.length === question.answers.length &&
                selectedCorrectAnswers?.length === selectedAnswers[index]?.length
            ) {
                score += 1;
            }
        });
        setScore(score);
    };

    const handleQuizStart = () => {
        document.documentElement.requestFullscreen();
        setFullscreenEnabled(true);
        setQuizStarted(true);
        setQuizCompleted(false);
        setCurrentQuestionIndex(0); 
        setTimeLeft(600); 
        setSelectedAnswers(new Array(quizData.length).fill([])); 
        startTimer();
    };

    const handleDone = () => {
        setQuizCompleted(false); 
        setQuizStarted(false); 
        setCurrentQuestionIndex(0); // reset question index
        setTimeLeft(600); // reset the timer
        setSelectedAnswers(new Array(quizData.length).fill([])); // reset selected answers
        localStorage.removeItem('currentQuestionIndex'); // clear local storage
        localStorage.removeItem('timeLeft');
        localStorage.removeItem('quizStarted');
        localStorage.removeItem('selectedAnswers');
    };

    const handleFullscreenChange = () => {
        if (!document.fullscreenElement) {
            setFullscreenEnabled(false);
        } else {
            setFullscreenEnabled(true);
        }
    };

    const handleScreen = () => {
        document.documentElement.requestFullscreen();
        setFullscreenEnabled(true);
    };

    if (!quizStarted && !quizCompleted) {
        return (
            <div className="flex items-center justify-center bg-gray-200 h-screen">
                <div className="flex flex-col w-1/2 h-3/5 items-center bg-gray-100 p-5">
                    <div className="text-center w-full text-5xl p-5 text-purple-900 font-bold mb-4">
                        <h1>Quiz</h1>
                    </div>

                    <div className="p-5">
                        <h3 className="text-2xl py-2 underline">Instructions:</h3>
                        <p className="text-2xl">
                            Works Only in Full Screen Mode.<br /> It has 10 questions and each question has multiple
                            answers.<br />
                            You have 10 minutes to answer all questions.<br /> Once the timer starts, it won't pause or
                            stop before 10 minutes.<br />
                        </p>
                        <button
                            className="bg-purple-900 hover:bg-purple-950 text-white font-bold py-2 px-4 rounded w-[150px] h-[50px] mt-4"
                            onClick={handleQuizStart}
                        >
                            Start Quiz
                        </button>
                    </div>
                </div>
            </div>
        );
    } else if (quizStarted && !fullscreenEnabled) {
        return (
            <div className="flex items-center justify-center bg-gray-200 h-screen">
                <div className="flex flex-col justify-center items-center w-1/2 h-3/5 bg-gray-50">
                    <h1 className="text-3xl">Enable Full Screen Mode to continue.</h1>
                    <button
                        className="bg-purple-900 hover:bg-purple-950 text-white font-bold py-2 px-4 rounded w-[200px] h-[50px] mt-4"
                        onClick={handleScreen}
                    >
                        Enable Full Screen
                    </button>
                </div>
            </div>
        );
    } else if (quizStarted && fullscreenEnabled) {
        return (
            <div className="flex items-center justify-center bg-gray-200 h-screen">
                <div className="w-1/2 h-3/5 bg-gray-50 p-5 relative">
                    <div className="absolute top-2 right-2">
                        <p className={`text-2xl pt-4 pr-5 ${timeLeft < 60 ? 'text-red-500' : ''}`}>
                            {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? '0' : ''}
                            {timeLeft % 60}
                        </p>
                    </div>
                    {quizData.length > 0 && !quizCompleted && (
                        <>
                            <h1 className="text-2xl font-bold text-center mb-4">
                                Question {currentQuestionIndex + 1}
                            </h1>
                            <p className="my-5 px-[3rem] pt-[3rem] text-2xl">
                                {quizData[currentQuestionIndex].question}
                            </p>
                            <div className="mb-4 px-[3rem] text-2xl">
                                {quizData[currentQuestionIndex].choices.map((choice, index) => (
                                    <div key={index} className="flex my-5  items-center">
                                        <input
                                            className="mr-2 h-[20px] w-[20px] rounded-full border-purple-500 text-purple-500 focus:ring-purple-500"
                                            type="checkbox"
                                            value={choice}
                                            checked={selectedAnswers[currentQuestionIndex]?.includes(choice) || false}
                                            onChange={() => handleAnswerSelect(choice)}
                                        />
                                        <label className="text-xl">{choice}</label>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between px-[3rem]">
                                <button
                                    className="bg-gray-300 text-black text-xl px-4 py-2 rounded"
                                    onClick={handlePreviousQuestion}
                                    disabled={currentQuestionIndex === 0}
                                >
                                    Previous
                                </button>
                                <button
                                    className="bg-gray-300 text-black text-xl px-4 py-2 rounded"
                                    onClick={handleNextQuestion}
                                >
                                    Next
                                </button>
                                <button
                                    className="bg-purple-900 text-white text-xl px-4 py-2 rounded"
                                    onClick={handleQuizCompletion}
                                >
                                    Submit
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    } else if (quizCompleted) {
        return (
            <div className="text-center mt-[10rem]">
                <h1 className="text-3xl mb-5 font-bold">Quiz Completed</h1>
                <p className="text-2xl">
                    Your score is {score !== null ? `${score}/${quizData.length}` : 'Calculating...'}
                </p>
                <button
                    className="bg-purple-900 text-white text-xl px-4 py-2 rounded mt-4 ml-4"
                    onClick={handleDone}
                >
                    Done
                </button>
            </div>
        );
    } else {
        return null;
    }
};

export default Quiz;
