import { EditorContent, useEditor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Youtube from '@tiptap/extension-youtube'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { Color } from '@tiptap/extension-color'
import { TextStyleKit } from '@tiptap/extension-text-style'
import CharacterCount from '@tiptap/extension-character-count'
import { TableKit } from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import { forwardRef, useEffect, useImperativeHandle } from 'react'
import { Suggestion } from '@tiptap/suggestion'
import type { SuggestionOptions } from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import {
    FaTrash, FaColumns, FaGripLines, FaEraser
} from 'react-icons/fa'
import { Extension } from '@tiptap/core'
import { supabase } from '../services/supabase';
import { v4 as uuidv4 } from 'uuid';


import {
    Box, Button, Flex, IconButton, Select, Tooltip, Divider,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    Input, useDisclosure, Popover, PopoverTrigger, PopoverContent, PopoverArrow, PopoverCloseButton, PopoverHeader, PopoverBody, InputGroup, InputLeftElement, Text, Wrap, WrapItem, SimpleGrid
} from '@chakra-ui/react'
import { useState, useCallback, useRef } from 'react'
import {
    FaBold, FaItalic, FaStrikethrough, FaLink, FaUnlink, FaListUl, FaListOl, FaQuoteLeft, FaCode, FaImage, FaPaintBrush, FaUnderline, FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify, FaTable, FaRulerHorizontal, FaUndo, FaRedo, FaTrashAlt
} from 'react-icons/fa'
import { BiColorFill, BiFilm } from 'react-icons/bi'
import { LuImageUp } from "react-icons/lu";


// --- ESTILOS GLOBAIS DO EDITOR ---
const editorStyles = {
    '> .tiptap': {
        minHeight: '400px',
        padding: '16px',
        outline: 'none',
        '& > p:first-of-type::before': {
            content: 'attr(data-placeholder)',
            float: 'left',
            color: 'gray.400',
            pointerEvents: 'none',
            height: 0,
        },
        'h1, h2, h3': {
            lineHeight: 1.2,
            fontWeight: 'bold',
        },
        'h1': { fontSize: '2em', my: '0.67em' },
        'h2': { fontSize: '1.5em', my: '0.83em' },
        'h3': { fontSize: '1.25em', my: '1em' },
        'a': { color: 'blue.500', textDecoration: 'underline', cursor: 'pointer' },
        'blockquote': { paddingLeft: '1rem', borderLeft: '3px solid', borderColor: 'gray.300', fontStyle: 'italic', marginY: '1rem' },
        'pre': { bg: 'gray.900', color: 'white', fontFamily: 'monospace', padding: '0.75rem 1rem', borderRadius: '0.5rem', '& code': { color: 'inherit', padding: 0, background: 'none', fontSize: '0.85rem' } },
        'img': { maxWidth: '100%', height: 'auto', display: 'block', ml: 'auto', mr: 'auto', cursor: 'pointer' },
        'iframe': { width: '100%', aspectRatio: '16 / 9', height: 'auto' },
        'mark': { backgroundColor: '#FAF594', padding: '1px 3px', borderRadius: '2px' },
        'ul, ol': { paddingLeft: '2rem', listStylePosition: 'outside' },
        'hr': { marginY: '2rem' },
        'table': { width: '100%', borderCollapse: 'collapse', margin: '1rem 0', 'th, td': { border: '1px solid', borderColor: 'gray.300', padding: '8px', verticalAlign: 'top' }, 'th': { bg: 'gray.100', fontWeight: 'bold' } },
    }
}


// --- COMPONENTES AUXILIARES ---

// Seletor de Cores
const ColorPickerPopover = ({ icon, tooltip, editor, type }: { icon: React.ElementType, tooltip: string, editor: any, type: 'color' | 'highlight' }) => {
    const colors = ['#000000', '#E03131', '#2F9E44', '#1971C2', '#F08C00', '#A61E4D', '#862E9C', '#C2255C', '']
    const colorInputRef = useRef<HTMLInputElement>(null);

    const handleColorChange = (color: string) => {
        if (type === 'color') {
            if (color) editor.chain().focus().setColor(color).run()
            else editor.chain().focus().unsetColor().run()
        }
        if (type === 'highlight') {
            if (color) editor.chain().focus().toggleHighlight({ color }).run()
            else editor.chain().focus().unsetHighlight().run()
        }
    }

    return (
        <Popover>
            <PopoverTrigger>
                <Box>
                    <Tooltip label={tooltip}>
                        <IconButton as="div" size="sm" aria-label={tooltip} icon={icon as any} isActive={editor.isActive(type)} />
                    </Tooltip>
                </Box>
            </PopoverTrigger>
            <PopoverContent width="auto">
                <PopoverArrow />
                <PopoverBody>
                    <SimpleGrid columns={4} spacing={2} mb={3}>
                        {colors.map((color, index) => (
                            <Button key={index} height="30px" minWidth="30px" p={0} onClick={() => handleColorChange(color)} bg={color || 'transparent'} border={color ? '1px solid lightgray' : '1px dashed gray'} _hover={{ transform: 'scale(1.1)' }}>
                                {color === '' && <FaTrashAlt />}
                            </Button>
                        ))}
                    </SimpleGrid>
                    <Button size="sm" w="100%" onClick={() => colorInputRef.current?.click()}>Cor customizada</Button>
                    <input type="color" ref={colorInputRef} onChange={(e) => handleColorChange(e.target.value)} style={{ display: 'none' }} />
                </PopoverBody>
            </PopoverContent>
        </Popover>
    )
}

// Toolbar Fixa
const Toolbar = ({ editor, onImageUpload }: { editor: any, onImageUpload: () => void }) => {
    const { isOpen: isVideoOpen, onOpen: onVideoOpen, onClose: onVideoClose } = useDisclosure()
    const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure()
    const [videoUrl, setVideoUrl] = useState('')
    const [imageUrl, setImageUrl] = useState('')

    const handleAddVideo = () => {
        if (videoUrl) editor.chain().focus().setYoutubeVideo({ src: videoUrl }).run()
        setVideoUrl('')
        onVideoClose()
    }

    const handleAddImage = () => {
        if (imageUrl) editor.chain().focus().setImage({ src: imageUrl }).run()
        setImageUrl('')
        onImageClose()
    }

    const setLink = useCallback(() => {
        const url = window.prompt('URL', editor.getAttributes('link').href)
        if (url === null) return
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
        }
    }, [editor])

    if (!editor) return null

    return (
        <>
            <Flex p={2} borderBottomWidth="1px" wrap="wrap" gap={1} bg="gray.50" position="sticky" top={0} zIndex={10}>
                {/* Estilos de Texto */}
                <WrapItem>
                    <Select
                        size="sm" w="auto" bg="white"
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value === 'p') {
                                editor.chain().focus().setParagraph().run()
                            } else {
                                editor.chain().focus().toggleHeading({ level: parseInt(value) as any }).run()
                            }
                        }}
                        value={
                            editor.isActive('heading', { level: 1 }) ? '1' :
                                editor.isActive('heading', { level: 2 }) ? '2' :
                                    editor.isActive('heading', { level: 3 }) ? '3' : 'p'
                        }
                    >
                        <option value="p">Parágrafo</option>
                        <option value="1">Título 1</option>
                        <option value="2">Título 2</option>
                        <option value="3">Título 3</option>
                    </Select>
                </WrapItem>

                <Divider orientation="vertical" h="32px" mx={1} />

                {/* Formatação Inline */}
                <Wrap spacing={1}>
                    <WrapItem><Tooltip label="Negrito (Ctrl+B)"><IconButton size="sm" aria-label="Bold" onClick={() => editor.chain().focus().toggleBold().run()} icon={<FaBold />} isActive={editor.isActive('bold')} /></Tooltip></WrapItem>
                    <WrapItem><Tooltip label="Itálico (Ctrl+I)"><IconButton size="sm" aria-label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} icon={<FaItalic />} isActive={editor.isActive('italic')} /></Tooltip></WrapItem>
                    <WrapItem><Tooltip label="Sublinhado (Ctrl+U)"><IconButton size="sm" aria-label="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} icon={<FaUnderline />} isActive={editor.isActive('underline')} /></Tooltip></WrapItem>
                    <WrapItem><Tooltip label="Link (Ctrl+K)"><IconButton size="sm" aria-label="Add Link" onClick={setLink} icon={<FaLink />} isActive={editor.isActive('link')} /></Tooltip></WrapItem>
                    <WrapItem><ColorPickerPopover icon={FaPaintBrush} tooltip="Cor do Texto" editor={editor} type="color" /></WrapItem>
                    <WrapItem><ColorPickerPopover icon={BiColorFill} tooltip="Realçar Texto" editor={editor} type="highlight" /></WrapItem>
                </Wrap>

                <Divider orientation="vertical" h="32px" mx={1} />

                {/* Alinhamento */}
                <Wrap spacing={1}>
                    <WrapItem><Tooltip label="Alinhar à Esquerda"><IconButton size="sm" aria-label="Align Left" onClick={() => editor.chain().focus().setTextAlign('left').run()} icon={<FaAlignLeft />} isActive={editor.isActive({ textAlign: 'left' })} /></Tooltip></WrapItem>
                    <WrapItem><Tooltip label="Centralizar"><IconButton size="sm" aria-label="Align Center" onClick={() => editor.chain().focus().setTextAlign('center').run()} icon={<FaAlignCenter />} isActive={editor.isActive({ textAlign: 'center' })} /></Tooltip></WrapItem>
                    <WrapItem><Tooltip label="Alinhar à Direita"><IconButton size="sm" aria-label="Align Right" onClick={() => editor.chain().focus().setTextAlign('right').run()} icon={<FaAlignRight />} isActive={editor.isActive({ textAlign: 'right' })} /></Tooltip></WrapItem>
                    <WrapItem><Tooltip label="Justificar"><IconButton size="sm" aria-label="Align Justify" onClick={() => editor.chain().focus().setTextAlign('justify').run()} icon={<FaAlignJustify />} isActive={editor.isActive({ textAlign: 'justify' })} /></Tooltip></WrapItem>
                </Wrap>

                <Divider orientation="vertical" h="32px" mx={1} />

                {/* Blocos e Listas */}
                <Wrap spacing={1}>
                    <WrapItem><Tooltip label="Lista com marcadores"><IconButton size="sm" aria-label="Bullet List" onClick={() => editor.chain().focus().toggleBulletList().run()} icon={<FaListUl />} isActive={editor.isActive('bulletList')} /></Tooltip></WrapItem>
                    <WrapItem><Tooltip label="Lista numerada"><IconButton size="sm" aria-label="Ordered List" onClick={() => editor.chain().focus().toggleOrderedList().run()} icon={<FaListOl />} isActive={editor.isActive('orderedList')} /></Tooltip></WrapItem>
                    <WrapItem><Tooltip label="Citação"><IconButton size="sm" aria-label="Blockquote" onClick={() => editor.chain().focus().toggleBlockquote().run()} icon={<FaQuoteLeft />} isActive={editor.isActive('blockquote')} /></Tooltip></WrapItem>
                    <WrapItem><Tooltip label="Bloco de Código"><IconButton size="sm" aria-label="Code Block" onClick={() => editor.chain().focus().toggleCodeBlock().run()} icon={<FaCode />} isActive={editor.isActive('codeBlock')} /></Tooltip></WrapItem>
                </Wrap>

                <Divider orientation="vertical" h="32px" mx={1} />

                {/* Inserções */}
                <Wrap spacing={1}>
                    <WrapItem><Tooltip label="Adicionar Imagem por URL"><IconButton size="sm" aria-label="Add Image from URL" onClick={onImageOpen} icon={<FaImage />} /></Tooltip></WrapItem>
                    <WrapItem><Tooltip label="Upload de Imagem"><IconButton size="sm" aria-label="Upload Image" onClick={onImageUpload} icon={<LuImageUp />} /></Tooltip></WrapItem>
                    <WrapItem><Tooltip label="Adicionar Vídeo do YouTube"><IconButton size="sm" aria-label="Add YouTube Video" onClick={onVideoOpen} icon={<BiFilm />} /></Tooltip></WrapItem>
                    <WrapItem><Tooltip label="Inserir Tabela"><IconButton size="sm" aria-label="Insert Table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} icon={<FaTable />} /></Tooltip></WrapItem>
                    <WrapItem><Tooltip label="Linha Horizontal"><IconButton size="sm" aria-label="Horizontal Rule" onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={<FaRulerHorizontal />} /></Tooltip></WrapItem>
                </Wrap>

                <Divider orientation="vertical" h="32px" mx={1} />

                {/* Ações */}
                <Wrap spacing={1} ml={{ base: 0, md: 'auto' }}>
                    <WrapItem><Tooltip label="Limpar Formatação"><IconButton size="sm" aria-label="Clear Format" onClick={() => editor.chain().focus().unsetAllMarks().run()} icon={<FaTrashAlt />} /></Tooltip></WrapItem>
                    <WrapItem><Tooltip label="Desfazer (Ctrl+Z)"><IconButton size="sm" aria-label="Undo" onClick={() => editor.chain().focus().undo().run()} icon={<FaUndo />} isDisabled={!editor.can().undo()} /></Tooltip></WrapItem>
                    <WrapItem><Tooltip label="Refazer (Ctrl+Y)"><IconButton size="sm" aria-label="Redo" onClick={() => editor.chain().focus().redo().run()} icon={<FaRedo />} isDisabled={!editor.can().redo()} /></Tooltip></WrapItem>
                </Wrap>
            </Flex>

            {/* Modais */}
            <Modal isOpen={isVideoOpen} onClose={onVideoClose} isCentered><ModalOverlay /><ModalContent><ModalHeader>Adicionar Vídeo do YouTube</ModalHeader><ModalCloseButton /><ModalBody><Input placeholder="Cole a URL do vídeo aqui" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} /></ModalBody><ModalFooter><Button variant="ghost" mr={3} onClick={onVideoClose}>Cancelar</Button><Button colorScheme="blue" onClick={handleAddVideo}>Adicionar</Button></ModalFooter></ModalContent></Modal>
            <Modal isOpen={isImageOpen} onClose={onImageClose} isCentered><ModalOverlay /><ModalContent><ModalHeader>Adicionar Imagem da URL</ModalHeader><ModalCloseButton /><ModalBody><Input placeholder="Cole a URL da imagem aqui" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} /></ModalBody><ModalFooter><Button variant="ghost" mr={3} onClick={onImageClose}>Cancelar</Button><Button colorScheme="blue" onClick={handleAddImage}>Adicionar</Button></ModalFooter></ModalContent></Modal>
        </>
    )
}

const SlashCommandExtension = Extension.create({
    name: 'slashCommand',

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                // A lógica que estava em 'suggestionConfig' agora vive aqui
                items: ({ query }) => {
                    return [
                        { title: 'Título 1', icon: () => <Text fontWeight="bold">T1</Text>, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run() } },
                        { title: 'Título 2', icon: () => <Text fontWeight="bold">T2</Text>, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run() } },
                        { title: 'Lista', icon: FaListUl, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).toggleBulletList().run() } },
                        { title: 'Tabela', icon: FaTable, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() } },
                        { title: 'Citação', icon: FaQuoteLeft, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).toggleBlockquote().run() } },
                        { title: 'Divisor', icon: FaRulerHorizontal, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).setHorizontalRule().run() } },
                        { title: 'Código', icon: FaCode, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).toggleCodeBlock().run() } }
                    ].filter(item => item.title.toLowerCase().startsWith(query.toLowerCase())).slice(0, 10)
                },
                render: () => {
                    let component: ReactRenderer<any>;
                    let popup: any;

                    return {
                        onStart: props => {
                            component = new ReactRenderer(CommandList, {
                                props,
                                editor: props.editor,
                            });
                            popup = tippy(document.body, {
                                getReferenceClientRect: () => {
                                    const rect = props.clientRect?.();
                                    // Fallback to a default rect if null/undefined
                                    return rect ?? new DOMRect(0, 0, 0, 0);
                                },
                                appendTo: () => document.body,
                                content: component.element,
                                showOnCreate: true,
                                interactive: true,
                                trigger: 'manual',
                                placement: 'bottom-start',
                            });
                        },
                        onUpdate(props) {
                            component.updateProps(props);
                            popup[0].setProps({
                                getReferenceClientRect: props.clientRect,
                            });
                        },
                        onKeyDown(props) {
                            if (props.event.key === 'Escape') {
                                popup[0].hide()
                                return true
                            }
                            return component.ref?.onKeyDown(props);
                        },
                        onExit() {
                            popup[0].destroy();
                            component.destroy();
                        },
                    };
                },
            }),
        ]
    },
})

const CommandList = forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        if (index >= props.items.length) {
            index = 0;
        }
        if (index < 0) {
            index = props.items.length - 1;
        }
        props.command(props.items[index]);
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: React.KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
                return true;
            }
            if (event.key === 'ArrowDown') {
                setSelectedIndex((selectedIndex + 1) % props.items.length);
                return true;
            }
            if (event.key === 'Enter') {
                selectItem(selectedIndex);
                return true;
            }
            return false;
        },
    }));

    return (
        <Box bg="white" p={2} borderRadius="md" shadow="lg" border="1px" borderColor="gray.200">
            {props.items.length ? (
                props.items.map((item: any, index: number) => (
                    <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        w="100%"
                        justifyContent="flex-start"
                        bg={index === selectedIndex ? 'gray.100' : 'transparent'}
                        leftIcon={<item.icon />}
                        onClick={() => selectItem(index)}
                    >
                        {item.title}
                    </Button>
                ))
            ) : (
                <Box p={2}>Nenhum resultado</Box>
            )}
        </Box>
    );
});

// Menu de Bolha (Contexto)
const EnhancedBubbleMenu = ({ editor }: { editor: any }) => {
    // ... (a lógica do link continua a mesma, então você pode copiar a parte do link da sua versão anterior)
    const [linkUrl, setLinkUrl] = useState('');
    const openLinkEditor = useCallback(() => { setLinkUrl(editor.getAttributes('link').href || ''); }, [editor]);
    const saveLink = useCallback(() => {
        if (linkUrl === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); }
        else { editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run(); }
    }, [editor, linkUrl]);


    // Menu de contexto para TABELAS com ÍCONES
    if (editor.isActive('table')) {
        return (
            <BubbleMenu editor={editor}>
                <Flex bg="white" p={1} borderRadius="md" shadow="lg" border="1px" borderColor="gray.200" gap={1}>
                    <Tooltip label="Adicionar coluna antes"><IconButton size="sm" variant="ghost" icon={<FaColumns style={{ transform: 'rotate(-90deg)' }} />} onClick={() => editor.chain().focus().addColumnBefore().run()} aria-label="Adicionar coluna antes" /></Tooltip>
                    <Tooltip label="Adicionar coluna depois"><IconButton size="sm" variant="ghost" icon={<FaColumns />} onClick={() => editor.chain().focus().addColumnAfter().run()} aria-label="Adicionar coluna depois" /></Tooltip>
                    <Tooltip label="Excluir coluna"><IconButton size="sm" variant="ghost" colorScheme="red" icon={<FaEraser />} onClick={() => editor.chain().focus().deleteColumn().run()} aria-label="Excluir coluna" /></Tooltip>
                    <Divider orientation="vertical" h="24px" />
                    <Tooltip label="Adicionar linha acima"><IconButton size="sm" variant="ghost" icon={<FaGripLines style={{ transform: 'rotate(90deg)' }} />} onClick={() => editor.chain().focus().addRowBefore().run()} aria-label="Adicionar linha acima" /></Tooltip>
                    <Tooltip label="Adicionar linha abaixo"><IconButton size="sm" variant="ghost" icon={<FaGripLines />} onClick={() => editor.chain().focus().addRowAfter().run()} aria-label="Adicionar linha abaixo" /></Tooltip>
                    <Tooltip label="Excluir linha"><IconButton size="sm" variant="ghost" colorScheme="red" icon={<FaEraser style={{ transform: 'rotate(90deg)' }} />} onClick={() => editor.chain().focus().deleteRow().run()} aria-label="Excluir linha" /></Tooltip>
                    <Divider orientation="vertical" h="24px" />
                    <Tooltip label="Excluir tabela"><IconButton size="sm" variant="ghost" colorScheme="red" icon={<FaTrash />} onClick={() => editor.chain().focus().deleteTable().run()} aria-label="Excluir tabela" /></Tooltip>
                </Flex>
            </BubbleMenu>
        );
    }

    // Menu de contexto padrão para TEXTO
    return (
        <BubbleMenu editor={editor}>
            <Flex bg="white" p={1} borderRadius="md" shadow="lg" border="1px" borderColor="gray.200">
                <Tooltip label="Negrito"><IconButton size="sm" variant="ghost" aria-label="Bold" onClick={() => editor.chain().focus().toggleBold().run()} icon={<FaBold />} isActive={editor.isActive('bold')} /></Tooltip>
                <Tooltip label="Itálico"><IconButton size="sm" variant="ghost" aria-label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} icon={<FaItalic />} isActive={editor.isActive('italic')} /></Tooltip>
                <Tooltip label="Riscado"><IconButton size="sm" variant="ghost" aria-label="Strike" onClick={() => editor.chain().focus().toggleStrike().run()} icon={<FaStrikethrough />} isActive={editor.isActive('strike')} /></Tooltip>

                <Popover onOpen={openLinkEditor} placement="bottom">
                    <PopoverTrigger><Box><Tooltip label="Editar Link"><IconButton size="sm" variant="ghost" aria-label="Edit Link" icon={<FaLink />} isActive={editor.isActive('link')} /></Tooltip></Box></PopoverTrigger>
                    <PopoverContent>
                        <PopoverArrow />
                        <PopoverCloseButton />
                        <PopoverHeader>Editar URL</PopoverHeader>
                        <PopoverBody>
                            <InputGroup><InputLeftElement pointerEvents="none"><FaLink color="gray.300" /></InputLeftElement><Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://exemplo.com" /></InputGroup>
                            <Flex mt={2} justify="space-between" align="center">
                                <Button size="sm" colorScheme="blue" onClick={saveLink}>Salvar</Button>
                                {editor.isActive('link') && <IconButton size="sm" variant="ghost" colorScheme="red" aria-label="Remove Link" onClick={() => editor.chain().focus().unsetLink().run()} icon={<FaUnlink />} />}
                            </Flex>
                        </PopoverBody>
                    </PopoverContent>
                </Popover>
            </Flex>
        </BubbleMenu>
    )
}

const suggestionConfig: Omit<SuggestionOptions, 'editor'> = {
    items: ({ query }) => {
        return [
            { title: 'Título 1', icon: () => <Text fontWeight="bold">T1</Text>, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run() } },
            { title: 'Título 2', icon: () => <Text fontWeight="bold">T2</Text>, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run() } },
            { title: 'Lista', icon: FaListUl, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).toggleBulletList().run() } },
            { title: 'Tabela', icon: FaTable, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() } },
            { title: 'Citação', icon: FaQuoteLeft, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).toggleBlockquote().run() } },
            { title: 'Divisor', icon: FaRulerHorizontal, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).setHorizontalRule().run() } },
            { title: 'Código', icon: FaCode, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).toggleCodeBlock().run() } }
        ].filter(item => item.title.toLowerCase().startsWith(query.toLowerCase())).slice(0, 10)
    },
    render: () => {
        let component: ReactRenderer<any>;
        let popup: any;

        return {
            onStart: props => {
                component = new ReactRenderer(CommandList, {
                    props,
                    editor: props.editor,
                });
                popup = tippy(props.editor.view.dom, {
                    getReferenceClientRect: props.clientRect
                        ? () => props.clientRect!() as DOMRect
                        : undefined,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                });
            },
            onUpdate(props) {
                component.updateProps(props);
                popup[0].setProps({
                    getReferenceClientRect: props.clientRect,
                });
            },
            onKeyDown(props) {
                return component.ref?.onKeyDown(props);
            },
            onExit() {
                popup[0].destroy();
                component.destroy();
            },
        };
    },
};


// --- COMPONENTE PRINCIPAL ---
export const RichTextEditor = ({ content, onChange }: { content: any, onChange: (newContent: any) => void }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUploadClick = () => {
        fileInputRef.current?.click();
    };

    // --- LÓGICA DE UPLOAD ATUALIZADA ---
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !editor) {
            return;
        }

        try {
            // 1. Cria um nome de arquivo único para evitar conflitos
            const fileName = `${uuidv4()}-${file.name}`;
            const filePath = `public/${fileName}`; // Salva numa pasta 'public' dentro do bucket

            // 2. Faz o upload para o bucket 'note-images'
            const { error: uploadError } = await supabase.storage
                .from('note-images')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // 3. Pega a URL pública do arquivo que acabamos de enviar
            const { data: urlData } = supabase.storage
                .from('note-images')
                .getPublicUrl(filePath);

            if (!urlData.publicUrl) {
                throw new Error("Could not get public URL for the image.");
            }

            // 4. Insere a imagem no editor usando a URL
            editor.chain().focus().setImage({ src: urlData.publicUrl }).run();

        } catch (error) {
            console.error("Image upload failed:", error);
            // Opcional: Adicionar um toast/alerta para o usuário informando o erro
        }
    };


    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2, 3] }, horizontalRule: false }),
            Underline,
            Link.configure({ openOnClick: true, autolink: true, validate: href => /^https?:\/\//.test(href) }),
            Youtube.configure({ controls: true, nocookie: true }),
            Image.configure({ inline: false }),
            Highlight.configure({ multicolor: true }),
            TextStyleKit, Color,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TableKit.configure({}), TableRow, TableHeader, TableCell,
            HorizontalRule,
            Placeholder.configure({ placeholder: `Comece a escrever ou digite '/' para ver os comandos...` }),
            CharacterCount.configure({ limit: 20000 }),
            SlashCommandExtension,
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getJSON());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
            },
        }
    })

    return (
        <Box borderWidth="1px" borderRadius="md" sx={editorStyles} bg="white" position="relative">
            {editor && (
                <>
                    {/* A toolbar agora chama a função interna, não uma prop */}
                    <Toolbar editor={editor} onImageUpload={handleImageUploadClick} />
                    <EnhancedBubbleMenu editor={editor} />
                </>
            )}

            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />

            <Box p={{ base: 2, md: 4 }}>
                <EditorContent editor={editor} />
            </Box>

            {editor && (
                <Flex justify="flex-end" p={2} borderTopWidth="1px" bg="gray.50" position="sticky" bottom={0}>
                    <Text fontSize="sm" color="gray.500">
                        {editor.storage.characterCount.words()} palavras | {editor.storage.characterCount.characters()} caracteres
                    </Text>
                </Flex>
            )}
        </Box>
    )
}