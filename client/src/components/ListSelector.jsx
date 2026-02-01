import { useState } from 'react';
import './ListSelector.css';

const PERSONAL_ID = '__personal__';

function ListSelector({ lists, selectedListId, onSelect, onNewList, onManageList }) {
  const [open, setOpen] = useState(false);

  const currentLabel =
    selectedListId === null || selectedListId === PERSONAL_ID
      ? 'Personal'
      : lists.find((l) => l.id === selectedListId)?.name ?? 'Personal';

  return (
    <div className="list-selector">
      <button
        type="button"
        className="list-selector-trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="list-selector-label">{currentLabel}</span>
        <span className="list-selector-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <>
          <div className="list-selector-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="list-selector-dropdown" role="listbox">
            <button
              type="button"
              className={`list-selector-option ${selectedListId === null || selectedListId === PERSONAL_ID ? 'selected' : ''}`}
              onClick={() => {
                onSelect(null);
                setOpen(false);
              }}
            >
              Personal
            </button>
            {lists.map((list) => (
              <div key={list.id} className="list-selector-option-row">
                <button
                  type="button"
                  className={`list-selector-option ${selectedListId === list.id ? 'selected' : ''}`}
                  onClick={() => {
                    onSelect(list.id);
                    setOpen(false);
                  }}
                >
                  {list.name}
                  <span className="list-selector-role">{list.my_role === 'owner' ? ' (owner)' : ''}</span>
                </button>
                {(list.my_role === 'owner' || list.my_role === 'editor') && (
                  <button
                    type="button"
                    className="list-selector-manage"
                    onClick={(e) => {
                      e.stopPropagation();
                      onManageList(list);
                      setOpen(false);
                    }}
                    aria-label="Manage list"
                  >
                    ⋯
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="list-selector-new"
              onClick={() => {
                onNewList();
                setOpen(false);
              }}
            >
              + New list
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ListSelector;
export { PERSONAL_ID };
