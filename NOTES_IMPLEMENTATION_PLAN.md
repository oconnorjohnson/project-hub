# Notes System Implementation Plan

## Overview

Implement a Notion-like notes system using TipTap editor with document locking to prevent concurrent editing conflicts. Users can create, edit, and view rich-text documents with collaborative awareness through simple locking mechanism.

## Architecture Components

### 1. Database Schema Extensions

- **Documents Table**: Store document metadata and content
- **Document Locks Table**: Track active editing sessions
- **Document Versions Table**: Store document snapshots for version history

### 2. TipTap Editor Setup

- **Rich Text Editor**: TipTap with essential extensions
- **Toolbar**: Formatting controls (bold, italic, headings, lists, etc.)
- **Auto-save**: Periodic saving of document changes
- **Read-only Mode**: When document is locked by another user

### 3. Document Locking System

- **Lock Acquisition**: When user enters edit mode
- **Lock Release**: When user exits edit mode or session expires
- **Lock Timeout**: Automatic release after inactivity
- **Conflict Resolution**: Show read-only version when locked

### 4. API Endpoints

- **CRUD Operations**: Create, read, update, delete documents
- **Lock Management**: Acquire, release, check lock status
- **Version Management**: Save and retrieve document versions

## Implementation Steps

### Phase 1: Database Schema & Types

1. **Extend Database Schema**

   - Add `documents` table with content, metadata
   - Add `document_locks` table for editing sessions
   - Add `document_versions` table for history
   - Create necessary indexes and relationships

2. **TypeScript Types**
   - Document interfaces and types
   - Lock status types
   - Editor content types

### Phase 2: TipTap Editor Setup

1. **Install Dependencies**

   - @tiptap/react
   - @tiptap/starter-kit
   - @tiptap/extension-\* (various extensions)

2. **Editor Component**

   - Rich text editor with toolbar
   - Auto-save functionality
   - Read-only mode support
   - Content serialization/deserialization

3. **Toolbar Component**
   - Formatting buttons (bold, italic, underline)
   - Heading levels (H1, H2, H3)
   - Lists (bullet, numbered)
   - Text alignment
   - Link insertion

### Phase 3: Document Management API

1. **Documents API Routes**

   - `GET /api/documents` - List documents
   - `GET /api/documents/[id]` - Get document
   - `POST /api/documents` - Create document
   - `PATCH /api/documents/[id]` - Update document
   - `DELETE /api/documents/[id]` - Delete document

2. **Document Locks API Routes**
   - `POST /api/documents/[id]/lock` - Acquire lock
   - `DELETE /api/documents/[id]/lock` - Release lock
   - `GET /api/documents/[id]/lock` - Check lock status

### Phase 4: React Hooks & State Management

1. **Document Hooks**

   - `useDocuments()` - List and filter documents
   - `useDocument(id)` - Get single document
   - `useCreateDocument()` - Create new document
   - `useUpdateDocument()` - Update document content
   - `useDeleteDocument()` - Delete document

2. **Lock Management Hooks**
   - `useDocumentLock(id)` - Manage document lock
   - `useLockStatus(id)` - Check if document is locked
   - Auto-release locks on component unmount

### Phase 5: UI Components

1. **Document List Page**

   - Grid/list view of documents
   - Search and filter functionality
   - Create new document button
   - Document preview cards

2. **Document Editor Page**

   - TipTap editor with toolbar
   - Auto-save indicator
   - Lock status indicator
   - Version history access

3. **Document Viewer Page**
   - Read-only document display
   - Lock notification banner
   - Option to request edit access

### Phase 6: Navigation & Integration

1. **Add to Sidebar Navigation**

   - "Notes" or "Documents" menu item
   - Icon and navigation link

2. **Project Integration**
   - Link documents to projects (optional)
   - Project-specific document sections

## Technical Specifications

### Database Schema

```sql
-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_by UUID NOT NULL, -- User ID when auth is implemented
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document locks table
CREATE TABLE document_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  locked_by VARCHAR(255) NOT NULL, -- Session ID or user identifier
  locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(document_id)
);

-- Document versions table (for future version history)
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  version_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL
);
```

### TipTap Extensions

- **StarterKit**: Basic functionality (bold, italic, paragraph, etc.)
- **Heading**: H1, H2, H3 support
- **BulletList & OrderedList**: List functionality
- **Link**: URL linking
- **TextAlign**: Text alignment options
- **Placeholder**: Empty state text
- **CharacterCount**: Document statistics

### Lock Management Logic

1. **Lock Duration**: 30 minutes default, renewable
2. **Lock Renewal**: Every 5 minutes while editing
3. **Lock Timeout**: Auto-release after inactivity
4. **Conflict Handling**: Show notification when document is locked
5. **Grace Period**: 30 seconds to save changes before lock expires

### Auto-save Strategy

1. **Debounced Saving**: Save 2 seconds after user stops typing
2. **Periodic Backup**: Save every 30 seconds regardless
3. **Lock Renewal**: Extend lock on each save
4. **Conflict Detection**: Check lock status before saving

## Security Considerations

1. **Lock Validation**: Verify lock ownership before updates
2. **Session Management**: Tie locks to user sessions
3. **Content Sanitization**: Sanitize HTML content from editor
4. **Permission Checks**: Verify user can access/edit documents

## Future Enhancements

1. **Real-time Collaboration**: Upgrade to CRDT-based system
2. **Version History**: Full document version tracking
3. **Comments & Suggestions**: Collaborative review features
4. **Templates**: Pre-built document templates
5. **Export Options**: PDF, Markdown, HTML export
6. **Advanced Formatting**: Tables, images, embeds

## Success Criteria

- ✅ Users can create and edit rich-text documents
- ✅ Document locking prevents concurrent editing conflicts
- ✅ Auto-save prevents data loss
- ✅ Clean, intuitive editor interface
- ✅ Seamless integration with existing project structure
- ✅ Responsive design works on all devices

## Timeline Estimate

- **Phase 1-2**: Database & TipTap setup (2-3 hours)
- **Phase 3-4**: API & hooks development (3-4 hours)
- **Phase 5-6**: UI components & integration (4-5 hours)
- **Total**: ~10-12 hours of development time

This plan provides a solid foundation for a collaborative notes system while avoiding the complexity of real-time CRDT synchronization.
