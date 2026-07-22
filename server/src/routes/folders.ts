import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

// Get all folders
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching folders:', error.message);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Create a new folder
router.post('/', async (req, res) => {
  try {
    const { name, icon } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    const { data, error } = await supabase
      .from('folders')
      .insert({ name, icon: icon ?? null })
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error creating folder:', error.message);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Get a single folder
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching folder:', error.message);
    res.status(404).json({ error: 'Folder not found' });
  }
});

// Update a folder (rename and/or change icon)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon } = req.body;

    if (name !== undefined && typeof name !== 'string') {
      return res.status(400).json({ error: 'Folder name must be a string' });
    }

    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (icon !== undefined) update.icon = icon;

    const { data, error } = await supabase
      .from('folders')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error updating folder:', error.message);
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

// Delete a folder (classes inside it are unassigned, not deleted, via ON DELETE SET NULL)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Folder deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting folder:', error.message);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

export default router;
