- [ ] حفظ قائمة من الجلسات الماضية
- [ ] الرجوع للصفحة الرئيسية بعد إنتهاء الاختبار
- [ ] max out exam
- [ ] center summary

# تحسين الأداء

> مقترحات من Claude.ai النسخة المجانية

## High-Level Structural Changes

### 2. **Implement State Colocation**

Move timer logic to a dedicated hook/component that doesn't affect the main exam flow:

```typescript
// Isolate timer updates from exam state
const useTimer = () => {
  // Timer logic here, separate from main session
}
```

## Specific Performance Optimizations

### 2. **Separate Timer State**

```typescript
// Move timer to isolated context/hook
const TimerProvider = ({ children }) => {
  const [time, setTime] = useState(initialTime)
  // Timer logic isolated here
}
```

## Data Flow Improvements

### 1. **Event-Driven Updates**

Instead of passing dispatch functions through props, use event emitters or custom hooks for actions:

```typescript
const useExamActions = () => ({
  startExam: () => dispatch(startExamAction()),
  pauseExam: () => dispatch(pauseExamAction())
  // etc.
})
```

### 2. **Selective Re-rendering**

```typescript
// Components only re-render when their specific data changes
const ExamQuestion = () => {
  const currentQuestion = useSelector((state) => state.questions[state.currentIndex])
  const userAnswer = useSelector((state) => state.answers[state.currentIndex])
  // Only re-renders when question or answer changes
}
```
