import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { authenticatedUserId } from '../middleware/auth.js';

const router = Router();

async function ownsFolder(folderId: unknown, ownerId: string) {
  if (folderId === null || folderId === undefined) return true;
  const numericId = Number(folderId);
  if (!Number.isSafeInteger(numericId) || numericId <= 0) return false;
  const { data } = await supabase.from('folders').select('id').eq('id', numericId).eq('owner_id', ownerId).maybeSingle();
  return Boolean(data);
}

router.get('/', async (req, res) => {
  try {
    const ownerId = authenticatedUserId(req);
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('owner_id', ownerId)
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
    const ownerId = authenticatedUserId(req);
    const { name, folder_id } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Class name is required' });
    }
    if (!(await ownsFolder(folder_id, ownerId))) return res.status(404).json({ error: 'Folder not found' });

    const { data, error } = await supabase
      .from('classes')
      .insert({ name, folder_id: folder_id ?? null, owner_id: ownerId })
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
    const ownerId = authenticatedUserId(req);
    const { id } = req.params;

    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', id)
      .eq('owner_id', ownerId)
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
    const ownerId = authenticatedUserId(req);
    const { id } = req.params;
    const { name, folder_id } = req.body;

    if (name !== undefined && typeof name !== 'string') {
      return res.status(400).json({ error: 'Class name must be a string' });
    }
    if (!(await ownsFolder(folder_id, ownerId))) return res.status(404).json({ error: 'Folder not found' });

    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (folder_id !== undefined) update.folder_id = folder_id;

    const { data, error } = await supabase
      .from('classes')
      .update(update)
      .eq('id', id)
      .eq('owner_id', ownerId)
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
    const ownerId = authenticatedUserId(req);
    const { id } = req.params;

    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id)
      .eq('owner_id', ownerId);

    if (error) throw error;

    res.json({ message: 'Class deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting class:', error.message);
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

export default router;
