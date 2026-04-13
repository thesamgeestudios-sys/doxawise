import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CmsBlock {
  id: string;
  page_name: string;
  section_name: string;
  content_type: string;
  content_text: string | null;
  content_image_url: string | null;
  content_link: string | null;
  is_visible: boolean;
  display_order: number;
  metadata: any;
}

export function useCmsContent(pageName: string) {
  const [blocks, setBlocks] = useState<CmsBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('cms_pages')
        .select('*')
        .eq('page_name', pageName)
        .eq('is_visible', true)
        .order('display_order');
      if (data) setBlocks(data as CmsBlock[]);
      setLoading(false);
    };
    load();
  }, [pageName]);

  const getBlock = (sectionName: string) => blocks.find(b => b.section_name === sectionName);
  const getText = (sectionName: string, fallback: string) => getBlock(sectionName)?.content_text || fallback;
  const getImage = (sectionName: string) => getBlock(sectionName)?.content_image_url || '';
  const getBlocksByPrefix = (prefix: string) => blocks.filter(b => b.section_name.startsWith(prefix));

  return { blocks, loading, getBlock, getText, getImage, getBlocksByPrefix };
}
