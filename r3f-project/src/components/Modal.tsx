// src/components/Modal.tsx
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

// ============================================
// INTERFACE = Like a C# interface or a public struct
// Defines the "Inspector fields" this component expects
// ============================================
interface ModalProps {
  isOpen: boolean;              // Like a public bool in Unity
  onClose: () => void;          // Like a UnityEvent or Action callback
  title?: string;               // The "?" means optional (nullable)
  children: React.ReactNode;    // Special prop = whatever you nest inside <Modal>...</Modal>
}

// ============================================
// COMPONENT = Like a MonoBehaviour class
// 
// In Unity:    public class Modal : MonoBehaviour { }
// In React:    const Modal: React.FC<ModalProps> = (props) => { }
//
// FC = "Function Component" - tells TypeScript this is a React component
// The <ModalProps> is like generics in C# - defines what props we accept
// ============================================
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  // ^^^ This destructuring is like:
  // bool isOpen = props.isOpen;
  // Action onClose = props.onClose;
  // etc...

  // ============================================
  // useEffect = Like Start() + OnDestroy() combined
  // 
  // Runs side effects (things outside the render cycle)
  // The return function is cleanup (like OnDestroy)
  // The [dependencies] array = only re-run if these values change
  // ============================================
  useEffect(() => {
    // Only set up listener if modal is open
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    // Like: InputSystem.onKeyDown += HandleEscape
    document.addEventListener('keydown', handleEscape);

    // Cleanup function (like OnDestroy)
    // Like: InputSystem.onKeyDown -= HandleEscape
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]); // Re-run this effect if isOpen or onClose changes

  // ============================================
  // EARLY RETURN = Component renders nothing
  // Like setting a GameObject to inactive
  // ============================================
  if (!isOpen) return null;

  // ============================================
  // JSX = A declarative way to describe UI
  // 
  // Think of it like Unity's UI Toolkit (UXML) but inline with code
  // Each <div> is like instantiating a UI element
  // className is like assigning a USS class for styling
  // onClick is like AddListener() on a Button
  // ============================================
  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      {/* 
        stopPropagation = Don't let click "bubble up" to parent
        Like Unity's EventSystem: eventData.Use() to consume the event
      */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Header with optional title */}
        <div className="modal-header">
          {/* 
            Conditional rendering with &&
            Like: if (title != null) ShowTitle()
          */}
          {title && <h2 className="modal-title">{title}</h2>}
          
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* 
          {children} = Renders whatever you put between <Modal> and </Modal>
          Like a "slot" or content placeholder
        */}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );

  // ============================================
  // createPortal = Render this UI under a different parent
  // 
  // In Unity terms: Instead of this UI being a child of the current GameObject,
  // we're parenting it directly to the Canvas root (document.body)
  // 
  // WHY? The R3F <Canvas> can cause z-index/stacking issues.
  // Portal ensures our modal renders outside the Canvas DOM entirely.
  // ============================================
  return createPortal(modalContent, document.body);
};

export default Modal;





/** 
 // In some parent component
const [showModal, setShowModal] = useState(false);  // Like: private bool showModal;

return (
  <>
    <button onClick={() => setShowModal(true)}>Open Modal</button>
    
    <Modal 
      isOpen={showModal} 
      onClose={() => setShowModal(false)}
      title="Inventory Data"
    >
      
      <p>Your charts, images, data go here!</p>
    </Modal>
  </>
);
   */