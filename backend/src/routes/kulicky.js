const express = require('express');
const router = express.Router();
const database = require('../config/database');
const logger = require('../utils/logger');

// Middleware pro autentifikaci (zatím bez autentifikace pro testování)
const authenticateUser = (req, res, next) => {
    // Prozatím použijeme anonymního uživatele
    req.user = { id: 'anonymous-user-id' };
    next();
};

// GET /api/kulicky/:lessonId - Načtení všech kuliček pro lekci
router.get('/:lessonId', authenticateUser, async (req, res) => {
    try {
        const { lessonId } = req.params;
        const userId = req.user.id;

        // Načtení základních kuliček pro lekci
        const kulickyQuery = `
            SELECT id, text, order_index, created_at
            FROM kulicky 
            WHERE lesson_id = $1 
            ORDER BY order_index ASC, created_at ASC
        `;
        const kulickyResult = await database.query(kulickyQuery, [lessonId]);

        // Načtení stavu zaškrtnutí pro uživatele
        const stateQuery = `
            SELECT kulicka_id, is_checked, checked_at
            FROM user_kulicky_state 
            WHERE user_id = $1 AND kulicka_id = ANY($2)
        `;
        const kulickyIds = kulickyResult.rows.map(k => k.id);
        const stateResult = kulickyIds.length > 0 ? 
            await database.query(stateQuery, [userId, kulickyIds]) : 
            { rows: [] };

        // Načtení vlastních kuliček uživatele
        const customQuery = `
            SELECT id, text, is_checked, order_index, created_at, updated_at
            FROM custom_kulicky 
            WHERE user_id = $1 AND lesson_id = $2 AND deleted_at IS NULL
            ORDER BY order_index ASC, created_at ASC
        `;
        const customResult = await database.query(customQuery, [userId, lessonId]);

        // Vytvoření mapy stavů
        const stateMap = {};
        stateResult.rows.forEach(state => {
            stateMap[state.kulicka_id] = {
                is_checked: state.is_checked,
                checked_at: state.checked_at
            };
        });

        // Kombinace dat
        const kulicky = kulickyResult.rows.map(kulicka => ({
            id: kulicka.id,
            text: kulicka.text,
            order_index: kulicka.order_index,
            is_checked: stateMap[kulicka.id]?.is_checked || false,
            checked_at: stateMap[kulicka.id]?.checked_at || null,
            created_at: kulicka.created_at,
            is_custom: false
        }));

        const customKulicky = customResult.rows.map(kulicka => ({
            id: kulicka.id,
            text: kulicka.text,
            order_index: kulicka.order_index,
            is_checked: kulicka.is_checked,
            checked_at: kulicka.is_checked ? kulicka.updated_at : null,
            created_at: kulicka.created_at,
            is_custom: true
        }));

        // Kombinace a seřazení všech kuliček
        const allKulicky = [...kulicky, ...customKulicky]
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

        res.json({
            success: true,
            data: {
                lesson_id: parseInt(lessonId),
                kulicky: allKulicky
            }
        });

    } catch (error) {
        logger.error('Error fetching kulicky:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching kulicky',
            error: error.message
        });
    }
});

// POST /api/kulicky/:lessonId/check - Zaškrtnutí/odškrtnutí kuličky
router.post('/:lessonId/check', authenticateUser, async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { kulickaId, isChecked } = req.body;
        const userId = req.user.id;

        if (!kulickaId || typeof isChecked !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'kulickaId and isChecked are required'
            });
        }

        // Zkontrolujeme, jestli je to vlastní kulička nebo základní
        const checkCustomQuery = `
            SELECT id FROM custom_kulicky 
            WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
        `;
        const customResult = await database.query(checkCustomQuery, [kulickaId, userId]);

        if (customResult.rows.length > 0) {
            // Aktualizace vlastní kuličky
            const updateQuery = `
                UPDATE custom_kulicky 
                SET is_checked = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2 AND user_id = $3
                RETURNING id, is_checked, updated_at
            `;
            const result = await database.query(updateQuery, [isChecked, kulickaId, userId]);
            
            res.json({
                success: true,
                data: {
                    kulicka_id: kulickaId,
                    is_checked: result.rows[0].is_checked,
                    checked_at: result.rows[0].updated_at
                }
            });
        } else {
            // Aktualizace stavu základní kuličky
            const upsertQuery = `
                INSERT INTO user_kulicky_state (user_id, kulicka_id, is_checked, checked_at)
                VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                ON CONFLICT (user_id, kulicka_id)
                DO UPDATE SET 
                    is_checked = EXCLUDED.is_checked,
                    checked_at = EXCLUDED.checked_at
                RETURNING kulicka_id, is_checked, checked_at
            `;
            const result = await database.query(upsertQuery, [userId, kulickaId, isChecked]);
            
            res.json({
                success: true,
                data: {
                    kulicka_id: kulickaId,
                    is_checked: result.rows[0].is_checked,
                    checked_at: result.rows[0].checked_at
                }
            });
        }

    } catch (error) {
        logger.error('Error updating kulicka state:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating kulicka state',
            error: error.message
        });
    }
});

// POST /api/kulicky/:lessonId/add - Přidání nové vlastní kuličky
router.post('/:lessonId/add', authenticateUser, async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { text, orderIndex } = req.body;
        const userId = req.user.id;

        if (!text || text.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Text is required'
            });
        }

        const insertQuery = `
            INSERT INTO custom_kulicky (user_id, lesson_id, text, order_index, is_checked)
            VALUES ($1, $2, $3, $4, false)
            RETURNING id, text, order_index, is_checked, created_at
        `;
        const result = await database.query(insertQuery, [
            userId, 
            lessonId, 
            text.trim(), 
            orderIndex || 0
        ]);

        res.json({
            success: true,
            data: {
                id: result.rows[0].id,
                text: result.rows[0].text,
                order_index: result.rows[0].order_index,
                is_checked: result.rows[0].is_checked,
                created_at: result.rows[0].created_at,
                is_custom: true
            }
        });

    } catch (error) {
        logger.error('Error adding custom kulicka:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding custom kulicka',
            error: error.message
        });
    }
});

// PUT /api/kulicky/:kulickaId - Úprava textu vlastní kuličky
router.put('/:kulickaId', authenticateUser, async (req, res) => {
    try {
        const { kulickaId } = req.params;
        const { text } = req.body;
        const userId = req.user.id;

        if (!text || text.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Text is required'
            });
        }

        const updateQuery = `
            UPDATE custom_kulicky 
            SET text = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL
            RETURNING id, text, order_index, is_checked, updated_at
        `;
        const result = await database.query(updateQuery, [text.trim(), kulickaId, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kulicka not found or not owned by user'
            });
        }

        res.json({
            success: true,
            data: {
                id: result.rows[0].id,
                text: result.rows[0].text,
                order_index: result.rows[0].order_index,
                is_checked: result.rows[0].is_checked,
                updated_at: result.rows[0].updated_at,
                is_custom: true
            }
        });

    } catch (error) {
        logger.error('Error updating kulicka:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating kulicka',
            error: error.message
        });
    }
});

// DELETE /api/kulicky/:kulickaId - Smazání vlastní kuličky
router.delete('/:kulickaId', authenticateUser, async (req, res) => {
    try {
        const { kulickaId } = req.params;
        const userId = req.user.id;

        const deleteQuery = `
            UPDATE custom_kulicky 
            SET deleted_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
            RETURNING id
        `;
        const result = await database.query(deleteQuery, [kulickaId, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kulicka not found or not owned by user'
            });
        }

        res.json({
            success: true,
            message: 'Kulicka deleted successfully'
        });

    } catch (error) {
        logger.error('Error deleting kulicka:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting kulicka',
            error: error.message
        });
    }
});

module.exports = router;
