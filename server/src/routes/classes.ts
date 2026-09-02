import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching classes:', error.message);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, folder_id } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Class name is required' });
    }

    const { data, error } = await supabase
      .from('classes')
      .insert({ name, folder_id: folder_id ?? null })
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error creating class:', error.message);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching class:', error.message);
    res.status(404).json({ error: 'Class not found' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, folder_id } = req.body;

    if (name !== undefined && typeof name !== 'string') {
      return res.status(400).json({ error: 'Class name must be a string' });
    }

    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (folder_id !== undefined) update.folder_id = folder_id;

    const { data, error } = await supabase
      .from('classes')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error updating class:', error.message);
    res.status(500).json({ error: 'Failed to update class' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Class deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting class:', error.message);
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

export default router;
