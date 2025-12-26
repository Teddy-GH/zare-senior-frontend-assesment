import express from 'express';
import { getProjects, getProjectById, createProject, updateProject, deleteProject } from '../data/projectsData.js';

const router = express.Router();

// GET all projects with optional filtering and sorting
router.get('/', (req, res) => {
  try {
    let projects = getProjects();
    const { status, priority, search, sortBy, sortOrder } = req.query;
    
    // Filter by status
    if (status) {
      projects = projects.filter(p => p.status === status);
    }
    
    // Filter by priority
    if (priority) {
      projects = projects.filter(p => p.priority === priority);
    }
    
    // Search by name or description
    if (search) {
      const searchLower = search.toLowerCase();
      projects = projects.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Sorting
    if (sortBy) {
      const order = sortOrder === 'desc' ? -1 : 1;
      projects.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];
        
        // Handle nested properties
        if (sortBy === 'progress') {
          aVal = (a.tasks.completed / a.tasks.total) * 100;
          bVal = (b.tasks.completed / b.tasks.total) * 100;
        }
        
        if (typeof aVal === 'string') {
          return aVal.localeCompare(bVal) * order;
        }
        return (aVal - bVal) * order;
      });
    }
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET project by ID
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const project = getProjectById(id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE new project
router.post('/', (req, res) => {
  try {
    const { name, description, status, priority, deadline, team, tasks } = req.body;
    
    // Validation
    if (!name || !description || !status || !priority || !deadline) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const newProject = createProject({
      name,
      description,
      status,
      priority,
      deadline,
      team: team || 0,
      tasks: tasks || { completed: 0, total: 0 }
    });
    
    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE project
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    const updatedProject = updateProject(id, updates);
    
    if (!updatedProject) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE project
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = deleteProject(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

