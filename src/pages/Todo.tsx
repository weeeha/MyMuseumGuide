import { useState, useRef } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonCheckbox,
  IonFab,
  IonFabButton,
  IonIcon,
  IonSearchbar,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonModal,
  IonButton,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonButtons,
} from '@ionic/react';
import {
  add,
  trashOutline,
  flagOutline,
  checkmarkDoneOutline,
  calendarOutline,
  chevronDown,
  listOutline,
} from 'ionicons/icons';
import './Todo.css';

type Priority = 'high' | 'medium' | 'low';

interface TodoItem {
  id: string;
  title: string;
  note?: string;
  done: boolean;
  priority: Priority;
  dueDate?: string;
}

const initialTodos: TodoItem[] = [
  { id: '1', title: 'Design new onboarding flow', note: 'Review Figma mockups', done: false, priority: 'high', dueDate: 'Today' },
  { id: '2', title: 'Fix navigation bug on settings page', done: false, priority: 'high', dueDate: 'Today' },
  { id: '3', title: 'Write unit tests for auth module', note: '80% coverage target', done: false, priority: 'medium', dueDate: 'Today' },
  { id: '4', title: 'Update API documentation', done: false, priority: 'low', dueDate: 'Tomorrow' },
  { id: '5', title: 'Prepare sprint demo slides', note: 'Include performance metrics', done: false, priority: 'medium', dueDate: 'Tomorrow' },
  { id: '6', title: 'Review pull request #342', done: true, priority: 'medium' },
  { id: '7', title: 'Set up CI/CD pipeline', done: true, priority: 'high' },
  { id: '8', title: 'Create color palette for dark mode', done: true, priority: 'low' },
];

const Todo: React.FC = () => {
  const [todos, setTodos] = useState<TodoItem[]>(initialTodos);
  const [searchText, setSearchText] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newDueDate, setNewDueDate] = useState('Today');
  const listRef = useRef<HTMLIonListElement>(null);

  const filtered = todos.filter((t) =>
    t.title.toLowerCase().includes(searchText.toLowerCase())
  );
  const active = filtered.filter((t) => !t.done);
  const completed = filtered.filter((t) => t.done);

  const todayTasks = active.filter((t) => t.dueDate === 'Today');
  const upcomingTasks = active.filter((t) => t.dueDate !== 'Today');

  const totalActive = todos.filter((t) => !t.done).length;
  const totalDone = todos.filter((t) => t.done).length;

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    listRef.current?.closeSlidingItems();
  };

  const addTodo = () => {
    if (!newTitle.trim()) return;
    const todo: TodoItem = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      note: newNote.trim() || undefined,
      done: false,
      priority: newPriority,
      dueDate: newDueDate,
    };
    setTodos((prev) => [todo, ...prev]);
    resetForm();
    setShowModal(false);
  };

  const resetForm = () => {
    setNewTitle('');
    setNewNote('');
    setNewPriority('medium');
    setNewDueDate('Today');
  };

  const renderItem = (todo: TodoItem) => (
    <IonItemSliding key={todo.id}>
      <IonItemOptions side="end">
        <IonItemOption color="danger" onClick={() => deleteTodo(todo.id)}>
          <IonIcon slot="icon-only" icon={trashOutline} />
        </IonItemOption>
      </IonItemOptions>
      <IonItem lines="inset">
        <div className={`todo-priority todo-priority--${todo.priority}`} slot="start" />
        <IonCheckbox
          slot="start"
          checked={todo.done}
          onIonChange={() => toggleTodo(todo.id)}
        />
        <div className="todo-item-content">
          <div className={`todo-item-title ${todo.done ? 'todo-item-title--done' : ''}`}>
            {todo.title}
          </div>
          {todo.note && (
            <div className="todo-item-note">
              {todo.note}
            </div>
          )}
          {todo.dueDate && !todo.done && (
            <div className="todo-item-note">
              <IonIcon icon={calendarOutline} />
              {todo.dueDate}
            </div>
          )}
        </div>
      </IonItem>
    </IonItemSliding>
  );

  return (
    <IonPage className="todo-page">
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle size="large">My Tasks</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">My Tasks</IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* Summary chips */}
        <div className="todo-summary">
          <div className="todo-summary-chip todo-summary-chip--active">
            <IonIcon icon={flagOutline} />
            {totalActive} Active
          </div>
          <div className="todo-summary-chip todo-summary-chip--done">
            <IonIcon icon={checkmarkDoneOutline} />
            {totalDone} Done
          </div>
          <div className="todo-summary-chip todo-summary-chip--total">
            {todos.length} Total
          </div>
        </div>

        {/* Search */}
        <IonSearchbar
          value={searchText}
          onIonInput={(e) => setSearchText(e.detail.value ?? '')}
          placeholder="Search tasks..."
          animated
        />

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="todo-empty">
            <IonIcon icon={listOutline} />
            <h3>{searchText ? 'No results' : 'All clear!'}</h3>
            <p>
              {searchText
                ? 'Try a different search term'
                : 'Tap + to add your first task'}
            </p>
          </div>
        )}

        {/* Today section */}
        {todayTasks.length > 0 && (
          <>
            <div className="todo-section-header">Today</div>
            <IonList ref={listRef} className="todo-list" lines="none">
              {todayTasks.map(renderItem)}
            </IonList>
          </>
        )}

        {/* Upcoming section */}
        {upcomingTasks.length > 0 && (
          <>
            <div className="todo-section-header">Upcoming</div>
            <IonList className="todo-list" lines="none">
              {upcomingTasks.map(renderItem)}
            </IonList>
          </>
        )}

        {/* Completed section */}
        {completed.length > 0 && (
          <>
            <div
              className="completed-toggle"
              onClick={() => setShowCompleted(!showCompleted)}
            >
              <span>Completed ({completed.length})</span>
              <IonIcon
                icon={chevronDown}
                className={showCompleted ? 'expanded' : ''}
              />
            </div>
            {showCompleted && (
              <IonList className="todo-list" lines="none">
                {completed.map(renderItem)}
              </IonList>
            )}
          </>
        )}

        {/* Bottom spacer for FAB */}
        <div style={{ height: '100px' }} />

        {/* Add FAB */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton className="todo-fab" onClick={() => setShowModal(true)}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        {/* Add Todo Modal */}
        <IonModal
          isOpen={showModal}
          className="todo-modal"
          initialBreakpoint={0.65}
          breakpoints={[0, 0.65, 0.85]}
          onDidDismiss={() => {
            setShowModal(false);
            resetForm();
          }}
        >
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton
                  color="medium"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </IonButton>
              </IonButtons>
              <IonTitle>New Task</IonTitle>
              <IonButtons slot="end">
                <IonButton
                  strong
                  color="primary"
                  disabled={!newTitle.trim()}
                  onClick={addTodo}
                >
                  Add
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent>
            <div className="todo-modal-form">
              <IonItem>
                <IonInput
                  label="Title"
                  labelPlacement="stacked"
                  placeholder="What needs to be done?"
                  value={newTitle}
                  onIonInput={(e) => setNewTitle(e.detail.value ?? '')}
                  autofocus
                />
              </IonItem>

              <IonItem>
                <IonTextarea
                  label="Notes"
                  labelPlacement="stacked"
                  placeholder="Add details..."
                  value={newNote}
                  onIonInput={(e) => setNewNote(e.detail.value ?? '')}
                  rows={2}
                />
              </IonItem>

              <IonItem>
                <IonSelect
                  label="Due"
                  labelPlacement="stacked"
                  value={newDueDate}
                  onIonChange={(e) => setNewDueDate(e.detail.value)}
                >
                  <IonSelectOption value="Today">Today</IonSelectOption>
                  <IonSelectOption value="Tomorrow">Tomorrow</IonSelectOption>
                  <IonSelectOption value="This Week">This Week</IonSelectOption>
                  <IonSelectOption value="Next Week">Next Week</IonSelectOption>
                </IonSelect>
              </IonItem>

              <div>
                <IonLabel style={{
                  fontSize: 'var(--ft-foot)',
                  color: 'var(--tx-secondary)',
                  fontWeight: 600,
                  paddingLeft: 'var(--sp-xs)',
                  marginBottom: 'var(--sp-sm)',
                  display: 'block',
                }}>
                  Priority
                </IonLabel>
                <IonSegment
                  className="priority-segment"
                  value={newPriority}
                  onIonChange={(e) => setNewPriority(e.detail.value as Priority)}
                >
                  <IonSegmentButton value="low">
                    <IonLabel>Low</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="medium">
                    <IonLabel>Medium</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="high">
                    <IonLabel>High</IonLabel>
                  </IonSegmentButton>
                </IonSegment>
              </div>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Todo;
